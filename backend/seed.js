require('dotenv').config();
const mongoose = require('mongoose');
const Food = require('./models/Food');
const Event = require('./models/Event');
const User = require('./models/User');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);

  // Clear existing data
  await Food.deleteMany({});
  await Event.deleteMany({});
  await User.deleteMany({});

  // Create admin account
  const admin = await User.create({
    name: 'Admin',
    username: 'admin',
    password: 'admin123',
    phone: '0900000000',
    role: 'admin',
  });

  // Create shipper accounts
  const shipper1 = await User.create({
    name: 'Nguyễn Văn Tài',
    username: 'shipper1',
    password: '123456',
    phone: '0901000001',
    role: 'staff',
  });
  const shipper2 = await User.create({
    name: 'Trần Minh Đức',
    username: 'shipper2',
    password: '123456',
    phone: '0901000002',
    role: 'staff',
  });

  console.log('Admin account: username=admin, password=admin123');
  console.log('Shipper 1:', shipper1.name, '- username:', shipper1.username);
  console.log('Shipper 2:', shipper2.name, '- username:', shipper2.username);

  // Seed foods across 6 categories
  const foods = await Food.insertMany([
    // === Nước uống ===
    { name: 'Trà sữa trân châu', price: 30000, description: 'Trà sữa truyền thống với trân châu đen dai', category: 'nuoc_uong', eventType: 'blackfriday', discount: 25, isFlashSale: false },
    { name: 'Cà phê sữa đá', price: 25000, description: 'Cà phê phin đậm đà pha sữa đặc', category: 'nuoc_uong' },
    { name: 'Nước ép cam tươi', price: 35000, description: 'Cam vắt tươi nguyên chất 100%', category: 'nuoc_uong' },
    { name: 'Sinh tố bơ', price: 40000, description: 'Sinh tố bơ béo ngậy thơm mát', category: 'nuoc_uong', discount: 10, eventType: 'hourly' },
    { name: 'Trà đào cam sả', price: 32000, description: 'Trà đào thơm mát với cam và sả', category: 'nuoc_uong' },

    // === Lẩu ===
    { name: 'Lẩu Thái Tom Yum', price: 250000, description: 'Lẩu chua cay kiểu Thái với tôm, mực, nấm', category: 'lau', discount: 15, eventType: 'flashsale', isFlashSale: true },
    { name: 'Lẩu bò nhúng dấm', price: 280000, description: 'Lẩu bò tươi nhúng dấm chua ngọt', category: 'lau' },
    { name: 'Lẩu gà lá é', price: 220000, description: 'Lẩu gà thả vườn nấu lá é Phú Yên', category: 'lau', discount: 10, eventType: 'hourly' },
    { name: 'Lẩu cá kèo', price: 200000, description: 'Lẩu cá kèo lá giang chua thanh', category: 'lau' },

    // === Món nhậu ===
    { name: 'Gà chiên nước mắm', price: 120000, description: 'Gà chiên giòn tẩm nước mắm cay ngọt', category: 'mon_nhau', discount: 20, eventType: 'flashsale', isFlashSale: true },
    { name: 'Bò lúc lắc', price: 150000, description: 'Bò Úc lúc lắc sốt tiêu đen', category: 'mon_nhau' },
    { name: 'Mực chiên giòn', price: 100000, description: 'Mực tươi tẩm bột chiên giòn chấm muối ớt', category: 'mon_nhau' },
    { name: 'Cánh gà chiên mắm', price: 89000, description: 'Cánh gà rán giòn sốt mắm tỏi', category: 'mon_nhau', discount: 15, eventType: 'hourly' },
    { name: 'Tôm rang muối', price: 180000, description: 'Tôm sú rang muối ớt thơm lừng', category: 'mon_nhau' },

    // === Bún / Phở ===
    { name: 'Phở bò tái nạm', price: 55000, description: 'Phở bò Hà Nội nước dùng trong veo', category: 'bun_pho' },
    { name: 'Bún bò đặc biệt', price: 55000, description: 'Nước dùng đậm đà, bò viên, chả', category: 'bun_pho', discount: 10, eventType: 'hourly' },
    { name: 'Bún riêu cua', price: 45000, description: 'Bún riêu cua đồng ăn kèm rau sống', category: 'bun_pho' },
    { name: 'Phở gà', price: 50000, description: 'Phở gà ta thả vườn thơm ngon', category: 'bun_pho', discount: 15, eventType: 'flashsale', isFlashSale: true },
    { name: 'Bún chả Hà Nội', price: 50000, description: 'Bún chả thịt nướng kèm nước mắm chua ngọt', category: 'bun_pho' },

    // === Cơm ===
    { name: 'Cơm gà xối mỡ', price: 45000, description: 'Cơm gà giòn kèm dưa chua', category: 'com', discount: 15, eventType: 'flashsale', isFlashSale: true },
    { name: 'Cơm tấm sườn bì chả', price: 50000, description: 'Cơm tấm Sài Gòn đủ topping', category: 'com' },
    { name: 'Cơm chiên dương châu', price: 40000, description: 'Cơm chiên thập cẩm tôm, trứng, lạp xưởng', category: 'com', discount: 10, eventType: 'hourly' },
    { name: 'Cơm bò lúc lắc', price: 65000, description: 'Cơm trắng với bò lúc lắc sốt tiêu', category: 'com' },

    // === Ăn vặt ===
    { name: 'Bánh tráng trộn', price: 25000, description: 'Bánh tráng trộn tôm khô, bò khô, trứng cút', category: 'an_vat' },
    { name: 'Xiên que chiên', price: 15000, description: 'Xiên que các loại chiên giòn sốt cay', category: 'an_vat', discount: 20, eventType: 'flashsale', isFlashSale: true },
    { name: 'Takoyaki', price: 35000, description: 'Bánh bạch tuộc Nhật Bản nóng giòn', category: 'an_vat' },
    { name: 'Khoai tây lắc phô mai', price: 30000, description: 'Khoai tây chiên lắc bột phô mai', category: 'an_vat', discount: 10, eventType: 'hourly' },
    { name: 'Gỏi cuốn tôm thịt', price: 20000, description: 'Gỏi cuốn tươi mát chấm tương đen', category: 'an_vat' },
  ]);

  // Create events linking to discounted foods
  const flashSaleFoods = foods.filter(f => f.eventType === 'flashsale');
  const hourlyFoods = foods.filter(f => f.eventType === 'hourly');
  const blackfridayFoods = foods.filter(f => f.eventType === 'blackfriday');

  await Event.insertMany([
    {
      name: 'Flash Sale Trưa Nay',
      type: 'flashsale',
      discount: 15,
      startTime: new Date(),
      endTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
      foods: flashSaleFoods.map(f => f._id),
    },
    {
      name: 'Giảm Giá Theo Giờ 18h-20h',
      type: 'hourly',
      discount: 10,
      startTime: new Date(),
      endTime: new Date(Date.now() + 4 * 60 * 60 * 1000),
      foods: hourlyFoods.map(f => f._id),
    },
    {
      name: 'Black Friday Đồ Uống',
      type: 'blackfriday',
      discount: 25,
      startTime: new Date(),
      endTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      foods: blackfridayFoods.map(f => f._id),
    },
  ]);

  console.log(`Seeded ${foods.length} foods across 6 categories`);
  console.log('Seed data inserted successfully!');
  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
