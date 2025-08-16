import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerWalletClients } from '@/lib/server-wallet';

function checkDevEnvironment() {
	if (process.env.NODE_ENV === 'production') {
		throw new Error('This endpoint is only available in development environment');
	}
}

const devAirdropRecord = (prisma as any).devAirdropRecord;

export async function POST(request: NextRequest) {
	try {
		checkDevEnvironment();
		const { publicClient } = getServerWalletClients();

		const body = await request.json().catch(() => ({}));
		const limit = Math.min(Number(body.limit || 50), 200);

		// 取待确认记录
		const pending = await devAirdropRecord.findMany({
			where: { status: 'pending', transactionHash: { not: null } },
			orderBy: { createdAt: 'asc' },
			take: limit,
			select: { id: true, transactionHash: true }
		});

		let updatedSuccess = 0;
		let updatedFailed = 0;
		let stillPending = 0;

		for (const rec of pending) {
			try {
				const hash = rec.transactionHash as `0x${string}`;
				const receipt = await publicClient.getTransactionReceipt({ hash });

				if (!receipt) {
					stillPending += 1;
					continue;
				}

				if (receipt.status === 'success') {
					await devAirdropRecord.update({
						where: { id: rec.id },
						data: {
							status: 'success',
							blockNumber: receipt.blockNumber,
							gasUsed: receipt.gasUsed?.toString(),
							metadata: {
								step: 'reconciled_success',
								reconciledAt: new Date().toISOString(),
							}
						}
					});
					updatedSuccess += 1;
				} else if (receipt.status === 'reverted' || receipt.status === 'failed') {
					await devAirdropRecord.update({
						where: { id: rec.id },
						data: {
							status: 'failed',
							blockNumber: receipt.blockNumber,
							gasUsed: receipt.gasUsed?.toString(),
							metadata: {
								step: 'reconciled_failed',
								reconciledAt: new Date().toISOString(),
							}
						}
					});
					updatedFailed += 1;
				} else {
					stillPending += 1;
				}
			} catch (e) {
				stillPending += 1;
			}
		}

		return NextResponse.json({
			success: true,
			message: 'Reconciled pending airdrops',
			data: { total: pending.length, updatedSuccess, updatedFailed, stillPending }
		});
	} catch (error: any) {
		return NextResponse.json({ success: false, message: error.message || 'Reconcile failed' }, { status: 400 });
	}
}

