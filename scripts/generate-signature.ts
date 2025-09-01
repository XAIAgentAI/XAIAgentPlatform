import { ethers } from 'ethers';

async function main() {
  // 创建一个随机钱包
  const wallet = ethers.Wallet.createRandom();
  console.log('Address:', wallet.address);
  console.log('Private Key:', wallet.privateKey);

  // 要签名的消息
  const message = "Please sign to log in XAIAgent\n\nNonce: 25a9a993702cb3f695bab8aa8c31a1f6ed59ee2296635f640c2caece93e02344";

  // 签名消息
  const signature = await wallet.signMessage(message);
  console.log('Signature:', signature);

  // 验证签名
  const recoveredAddress = ethers.verifyMessage(message, signature);
  console.log('Recovered Address:', recoveredAddress);
  console.log('Addresses match:', recoveredAddress.toLowerCase() === wallet.address.toLowerCase());
}

main().catch(console.error); 