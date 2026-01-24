const mobileFlag = process.env.NEXT_PUBLIC_ENABLE_MOBILE_LAYOUT
export const ENABLE_MOBILE_LAYOUT = mobileFlag ? mobileFlag === 'true' : true
