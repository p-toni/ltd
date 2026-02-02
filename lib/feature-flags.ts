const mobileFlag = process.env.NEXT_PUBLIC_ENABLE_MOBILE_LAYOUT
export const ENABLE_MOBILE_LAYOUT = mobileFlag ? mobileFlag === 'true' : true

const aiFlag = process.env.NEXT_PUBLIC_ENABLE_AI
export const ENABLE_AI = aiFlag === 'true'
