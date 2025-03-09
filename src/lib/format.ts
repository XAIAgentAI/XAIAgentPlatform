/**
 * 格式化价格显示
 * @param price 价格数值
 * @param decimals 小数位数
 * @returns 格式化后的价格对象，包含显示值和交易对
 */
export const formatPrice = (price: number | undefined, decimals: number = 5): { value: string; pair: string } => {
  const pair = 'XAA/DBC';
  if (price === undefined || price === null) return { value: `0.${'0'.repeat(decimals)}`, pair };
  if (price === 0) return { value: `0.${'0'.repeat(decimals)}`, pair };

  const absPrice = Math.abs(price);
  if (absPrice < Math.pow(10, -decimals)) {
    // 只有在非常小的数字时才使用 0.0{x}y 格式
    const priceStr = absPrice.toString();
    const match = priceStr.match(/^0\.0+/);
    const zeroCount = match ? match[0].length - 2 : 0;
    const lastDigit = priceStr.replace(/^0\.0+/, '')[0] || '0';
    return { value: `0.0{${zeroCount}}${lastDigit}`, pair };
  }
  // 根据指定的精度显示小数位数
  return { value: absPrice.toFixed(decimals), pair };
}; 