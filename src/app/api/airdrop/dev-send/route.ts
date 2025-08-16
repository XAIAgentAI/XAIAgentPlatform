import { NextRequest, NextResponse } from 'next/server';
import { getServerWalletClients } from '@/lib/server-wallet';
import { currentChain, isTestnet } from '@/config/networks';
import { CONTRACTS } from '@/config/contracts';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import type { DevAirdropRecord, CreateAirdropRecordData, UpdateAirdropRecordData } from '@/types/dev-airdrop';

// Request parameter validation schema
const airdropRequestSchema = z.object({
	walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address format'),
	amount: z.string().regex(/^\d+(\.\d+)?$/, 'Invalid amount format'),
	tokenAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid token contract address format'),
	description: z.string().optional(),
});

// Environment check middleware
function checkDevEnvironment() {
	if (process.env.NODE_ENV === 'production') {
		throw new Error('This endpoint is only available in development environment');
	}
}

// Type assertion to access DevAirdropRecord model
const devAirdropRecord = (prisma as any).devAirdropRecord;

// Database operation wrapper function
async function safeDatabaseOperation<T>(operation: () => Promise<T>, fallback?: T): Promise<T> {
	try {
		return await operation();
	} catch (dbError: any) {
		console.error('❌ Database operation failed:', dbError.message);
		if (fallback !== undefined) {
			console.log('⚠️ Using fallback value to continue execution');
			return fallback;
		}
		throw new Error(`Database operation failed: ${dbError.message}`);
	}
}

export async function POST(request: NextRequest) {
	let airdropRecord: any = null;
	let transactionHash: string | null = null;
	
	try {
		// Environment check
		checkDevEnvironment();

		// Parse request body
		const body = await request.json();
		const validatedData = airdropRequestSchema.parse(body);
		
		const { walletAddress, amount, tokenAddress, description } = validatedData;

		console.log(`🚀 Development airdrop request: ${walletAddress} -> ${amount} tokens at ${tokenAddress}`);

		// Get server wallet clients
		const { walletClient, publicClient, serverAccount } = getServerWalletClients();

		// Check server wallet balance
		const balance = await publicClient.getBalance({ address: serverAccount.address });
		const balanceInEth = Number(balance) / 1e18;
		
		console.log(`💰 Server wallet balance: ${balanceInEth.toFixed(4)} ETH`);
		
		if (balanceInEth < 0.01) {
			throw new Error(`Insufficient balance for gas fees. Current balance: ${balanceInEth.toFixed(4)} ETH`);
		}

		// Check token balance (required)
		console.log(`🔍 Checking token balance...`);
		try {
			// Import XAA contract ABI
			const xaaAbiModule = await import('@/config/xaa-abi.json');
			const xaaAbi = xaaAbiModule.default;
			
			const tokenBalance = await publicClient.readContract({
				address: tokenAddress as `0x${string}`,
				abi: xaaAbi,
				functionName: 'balanceOf',
				args: [serverAccount.address]
			});
			const tokenBalanceInTokens = Number(tokenBalance) / 1e18;
			console.log(`🪙 Server wallet token balance: ${tokenBalanceInTokens.toFixed(4)} tokens`);
			
			if (tokenBalanceInTokens < parseFloat(amount)) {
				throw new Error(`Insufficient token balance. Required: ${amount}, Available: ${tokenBalanceInTokens.toFixed(4)}`);
			}
			console.log(`✅ Token balance sufficient`);
		} catch (tokenError: any) {
			console.error(`❌ Token balance check failed:`, tokenError.message);
			throw new Error(`Failed to check token balance: ${tokenError.message}`);
		}

		// Step 1: Create airdrop record (status: pending)
		console.log(`📝 Creating airdrop record...`);
		airdropRecord = await safeDatabaseOperation(async () => {
			return await devAirdropRecord.create({
				data: {
					walletAddress,
					amount,
					tokenAddress,
					description: description || `Dev airdrop: ${amount} tokens`,
					status: 'pending',
					environment: 'development',
					metadata: {
						serverWalletAddress: serverAccount.address,
						tokenContractAddress: tokenAddress,
						requestTimestamp: new Date().toISOString(),
						step: 'record_created'
					}
				}
			});
		});
		
		console.log(`✅ Airdrop record created: ${airdropRecord.id}`);

		// Step 2: Send transaction
		console.log(`📤 Sending airdrop transaction using standard transfer method...`);
		const amountInWei = BigInt(Math.floor(parseFloat(amount) * 1e18));
		
		// Import XAA contract ABI
		const xaaAbiModule = await import('@/config/xaa-abi.json');
		const xaaAbi = xaaAbiModule.default;
		
		const hash = await walletClient.writeContract({
			address: tokenAddress as `0x${string}`,
			abi: xaaAbi,
			functionName: 'transfer',
			args: [
				walletAddress as `0x${string}`,
				amountInWei
			],
		});
		
		transactionHash = hash;
		console.log(`✅ Airdrop transaction sent: ${hash}`);

		// Step 3: Update record with transaction hash
		console.log(`📝 Updating transaction hash...`);
		await safeDatabaseOperation(async () => {
			await devAirdropRecord.update({
				where: { id: airdropRecord.id },
				data: { 
					transactionHash: hash,
					status: 'pending',
					metadata: {
						serverWalletAddress: serverAccount.address,
						tokenContractAddress: tokenAddress,
						requestTimestamp: new Date().toISOString(),
						step: 'transaction_sent',
						transactionHash: hash
					}
				}
			});
		});

		// Step 4: Wait for transaction confirmation
		console.log(`⏳ Waiting for transaction confirmation...`);
		const receipt = await publicClient.waitForTransactionReceipt({ hash });
		
		console.log(`📋 Transaction receipt:`, {
			status: receipt.status,
			blockNumber: receipt.blockNumber,
			gasUsed: receipt.gasUsed?.toString(),
			logs: receipt.logs?.length || 0
		});
		
		if (receipt.status === 'success') {
			console.log(`🎉 Airdrop transaction confirmed successfully!`);
			
			// Step 5: Update record to success status
			console.log(`📝 Updating to success status...`);
			await safeDatabaseOperation(async () => {
				await devAirdropRecord.update({
					where: { id: airdropRecord.id },
					data: {
						status: 'success',
						blockNumber: receipt.blockNumber,
						gasUsed: receipt.gasUsed?.toString(),
						metadata: {
							serverWalletAddress: serverAccount.address,
							tokenContractAddress: tokenAddress,
							requestTimestamp: new Date().toISOString(),
							confirmedAt: new Date().toISOString(),
							blockHash: receipt.blockHash,
							effectiveGasPrice: receipt.effectiveGasPrice?.toString(),
							step: 'transaction_confirmed'
						}
					}
				});
			});

			return NextResponse.json({
				success: true,
				message: 'Airdrop sent successfully',
				data: {
					recordId: airdropRecord.id,
					walletAddress,
					amount,
					tokenAddress,
					transactionHash: hash,
					blockNumber: receipt.blockNumber?.toString(),
					gasUsed: receipt.gasUsed?.toString(),
				}
			});
		} else {
			// Transaction reverted
			console.log(`❌ Transaction reverted, status: ${receipt.status}`);
			
			// Update record to failed status
			await safeDatabaseOperation(async () => {
				await devAirdropRecord.update({
					where: { id: airdropRecord.id },
					data: {
						status: 'failed',
						blockNumber: receipt.blockNumber,
						gasUsed: receipt.gasUsed?.toString(),
						errorMessage: 'Transaction reverted by blockchain',
						metadata: {
							serverWalletAddress: serverAccount.address,
							tokenContractAddress: tokenAddress,
							requestTimestamp: new Date().toISOString(),
							revertedAt: new Date().toISOString(),
							blockHash: receipt.blockHash,
							receiptStatus: receipt.status,
							gasUsed: receipt.gasUsed?.toString(),
							step: 'transaction_reverted'
						}
					}
				});
			});
			
			throw new Error('Transaction reverted by blockchain. Possible reasons: insufficient token balance, invalid contract address, or contract restrictions.');
		}

	} catch (error: any) {
		console.error('❌ Airdrop sending failed:', error);
		
		// Error handling: update record based on current status
		if (airdropRecord && airdropRecord.id) {
			try {
				// If transaction hash exists, transaction was sent, need to check status
				if (transactionHash) {
					console.log(`🔍 Checking transaction status: ${transactionHash}`);
					try {
						const { publicClient } = getServerWalletClients();
						const receipt = await publicClient.getTransactionReceipt({ hash: transactionHash as `0x${string}` });
						
						await safeDatabaseOperation(async () => {
							await devAirdropRecord.update({
								where: { id: airdropRecord.id },
								data: {
									status: receipt.status === 'success' ? 'success' : 'failed',
									blockNumber: receipt.blockNumber,
									gasUsed: receipt.gasUsed?.toString(),
									errorMessage: receipt.status === 'success' ? null : 'Transaction failed',
									metadata: {
										errorType: error.constructor.name,
										errorMessage: error.message,
										transactionStatus: receipt.status,
										step: 'error_recovery',
										recoveredAt: new Date().toISOString()
									}
								}
							});
						});
						
						// If transaction actually succeeded, return success response
						if (receipt.status === 'success') {
							return NextResponse.json({
								success: true,
								message: 'Airdrop sent successfully (recovered from error)',
								data: {
									recordId: airdropRecord.id,
									transactionHash,
									blockNumber: receipt.blockNumber?.toString(),
									gasUsed: receipt.gasUsed?.toString(),
								}
							});
						}
					} catch (txError: any) {
						console.log(`⚠️ Unable to check transaction status:`, txError.message);
					}
				}
				
				// Update to failed status
				await safeDatabaseOperation(async () => {
					await devAirdropRecord.update({
						where: { id: airdropRecord.id },
						data: {
							status: 'failed',
							errorMessage: error.message,
							metadata: {
								errorType: error.constructor.name,
								errorStack: error.stack,
								timestamp: new Date().toISOString(),
								step: 'error_handling'
							}
						}
					});
				});
			} catch (dbError) {
				console.error('❌ Error updating failed record:', dbError);
			}
		} else {
			// If even record creation failed, create a failure record
			try {
				await safeDatabaseOperation(async () => {
					await devAirdropRecord.create({
						data: {
							walletAddress: 'unknown',
							amount: '0',
							tokenAddress: '0x0000000000000000000000000000000000000000',
							description: `Failed airdrop: ${error.message}`,
							status: 'failed',
							environment: 'development',
							errorMessage: error.message,
							metadata: {
								errorType: error.constructor.name,
								errorStack: error.stack,
								timestamp: new Date().toISOString(),
								step: 'initial_failure'
							}
						}
					});
				});
			} catch (dbError) {
				console.error('❌ Error creating failure record:', dbError);
			}
		}

		return NextResponse.json(
			{
				success: false,
				message: error.message || 'Failed to send airdrop',
				error: process.env.NODE_ENV === 'development' ? error.stack : undefined
			},
			{ status: 400 }
		);
	}
}

// Encode ERC20 transfer data
function encodeTransferData(to: string, amount: bigint): `0x${string}` {
	// transfer(address,uint256) function signature: 0xa9059cbb
	const functionSignature = '0xa9059cbb';
	const paddedAddress = to.slice(2).padStart(64, '0');
	const paddedAmount = amount.toString(16).padStart(64, '0');
	
	return `${functionSignature}${paddedAddress}${paddedAmount}` as `0x${string}`;
}

// GET method: Get development environment airdrop status and history records
export async function GET(request: NextRequest) {
	try {
		checkDevEnvironment();
		
		const { serverAccount } = getServerWalletClients();
		
		// Get query parameters
		const { searchParams } = new URL(request.url);
		const page = parseInt(searchParams.get('page') || '1');
		const limit = parseInt(searchParams.get('limit') || '10');
		const status = searchParams.get('status');
		const tokenAddress = searchParams.get('tokenAddress');
		const walletAddress = searchParams.get('walletAddress');
		
		// Build query conditions
		const where: any = {
			environment: 'development'
		};
		
		if (status) where.status = status;
		if (tokenAddress) where.tokenAddress = tokenAddress;
		if (walletAddress) where.walletAddress = walletAddress;
		
		// Get airdrop records
		const [records, totalCount] = await Promise.all([
			devAirdropRecord.findMany({
				where,
				orderBy: { createdAt: 'desc' },
				skip: (page - 1) * limit,
				take: limit,
				select: {
					id: true,
					walletAddress: true,
					amount: true,
					tokenAddress: true,
					description: true,
					transactionHash: true,
					blockNumber: true,
					gasUsed: true,
					status: true,
					errorMessage: true,
					createdAt: true,
					updatedAt: true
				}
			}),
			devAirdropRecord.count({ where })
		]);
		
		// Get statistics
		const stats = await devAirdropRecord.groupBy({
			by: ['status'],
			where: { environment: 'development' },
			_count: { status: true }
		});
		
		// Convert BigInt values to strings for JSON serialization
		const serializedRecords = records.map(record => ({
			...record,
			blockNumber: record.blockNumber ? record.blockNumber.toString() : null,
			gasUsed: record.gasUsed ? record.gasUsed.toString() : null
		}));

		return NextResponse.json({
			success: true,
			message: 'Development airdrop service is active',
			data: {
				serverWalletAddress: serverAccount.address,
				network: currentChain.name,
				chainId: currentChain.id,
				environment: process.env.NODE_ENV,
				isTestnet,
				records: serializedRecords,
				pagination: {
					page,
					limit,
					totalCount,
					totalPages: Math.ceil(totalCount / limit)
				},
				stats: stats.reduce((acc: Record<string, { count: number; totalAmount: string | null }>, stat: any) => {
					acc[stat.status] = {
						count: stat._count.status,
						totalAmount: null // Temporarily set to null since amount is string type
					};
					return acc;
				}, {} as Record<string, { count: number; totalAmount: string | null }>)
			}
		});
		
	} catch (error: any) {
		return NextResponse.json(
			{
				success: false,
				message: error.message || 'Service not available',
			},
			{ status: 403 }
		);
	}
} 