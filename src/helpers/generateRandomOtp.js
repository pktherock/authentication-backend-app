const generateRandomOtp = () => {
  const min = 100000; // 100000 is the smallest 6-digit number
  const max = 999999; // 999999 is the largest 6-digit number
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export default generateRandomOtp;
