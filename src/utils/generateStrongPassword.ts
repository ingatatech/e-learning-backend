export const generateStrongPassword = (length = 12): string => {
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const nums = "0123456789";

  const all = upper + lower + nums ;

  if (length < 8) throw new Error("Password too weak. Minimum 8 chars.");

  let password = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    nums[Math.floor(Math.random() * nums.length)],
  ];

  for (let i = 4; i < length; i++) {
    password.push(all[Math.floor(Math.random() * all.length)]);
  }

  // Shuffle that bad boy
  return password
    .sort(() => 0.5 - Math.random())
    .join('');
};