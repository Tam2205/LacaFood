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
    email: 'admin@example.com',
    password: 'admin123',
    phone: '0900000000',
    role: 'admin',
  });

  // Create shipper accounts
  const shipper1 = await User.create({
    name: 'Nguyễn Văn Tài',
    username: 'shipper1',
    email: 'shipper1@example.com',
    password: '123456',
    phone: '0901000001',
    role: 'staff',
  });
  const shipper2 = await User.create({
    name: 'Trần Minh Đức',
    username: 'shipper2',
    email: 'shipper2@example.com',
    password: '123456',
    phone: '0901000002',
    role: 'staff',
  });

  console.log('Admin account: username=admin, password=admin123');
  console.log('Shipper 1:', shipper1.name, '- username:', shipper1.username);
  console.log('Shipper 2:', shipper2.name, '- username:', shipper2.username);

  const promoEnd = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 ngày sau

  // Seed foods across 6 categories
  const foods = await Food.insertMany([
      // Mon nhau
      { name: 'Mực khô nướng', description: 'Mực khô nướng trên cồn, xé tơi, chấm tương ớt; vị ngọt, dai và thơm nồng.',
         image:"https://tse1.explicit.bing.net/th/id/OIP.qGxxgaleLqis8NQzUCRddAHaEH?rs=1&pid=ImgDetMain&o=7&rm=3", price: 89000, category: 'mon-nhau', isPromotion: true, promotionPrice: 69000, promotionEnd: promoEnd },
      { name: 'Trâu gác bếp', description: 'Thịt trâu hun khói dai, ngọt, thơm mùi mắc khén và hạt dỗi đặc trưng vùng cao.', 
        image: "https://th.bing.com/th/id/OIP.SkORPZQMbxCkS7bLqSGZ2QHaE8?w=291&h=194&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3", price: 75000, category: 'mon-nhau' },
      { name: 'Bò lúc lắc', description: 'Bò Úc lúc lắc mềm ngọt, kèm rau sống',
         image: "https://th.bing.com/th/id/OIP.VhDtarX1a67uVeooY1akPAHaEK?w=306&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3", price: 120000, category: 'mon-nhau', isPromotion: true, promotionPrice: 95000, promotionEnd: promoEnd },
      { name: 'Đậu hũ lướt ván', description: 'Đậu hũ tươi chiên vàng lớp vỏ nhưng bên trong vẫn mềm mịn như tan trong miệng.', 
        image: "https://th.bing.com/th/id/OIP.Wcpcj5xQ8m112uaK-yO97AHaEo?w=269&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3", price: 95000, category: 'mon-nhau' },

      // Trà sữa
      { name: 'Trà sữa trân châu đường đen', description: 'Trà sữa thơm béo, trân châu đường đen Q dẻo',
         image: "https://th.bing.com/th/id/OIP.V1x45a263htiSm8-e2geyAHaEo?w=312&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3", price: 35000, category: 'tra-sua', isPromotion: true, promotionPrice: 25000, promotionEnd: promoEnd },
      { name: 'Matcha Latte', description: 'một loại thức uống hiện đại kết hợp giữa tinh hoa trà đạo Nhật Bản và phong cách cà phê Ý (Latte).',
         image: "https://th.bing.com/th/id/OIP.hWdT_h74LiDWZPE1U7j7NwHaE8?w=265&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3", price: 40000, category: 'tra-sua' },
      { name: 'Trà đào cam sả', description: 'Trà đào thơm mát, cam tươi và sả thư giãn',
         image: "https://th.bing.com/th/id/OIP.LyJHURwCCeZWpoxt6gU5XAHaFy?w=304&h=189&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3", price: 30000, category: 'tra-sua' },
      { name: 'Trà sữa oolong', description: 'Trà oolong rang lửa, vị đậm đà béo ngọt',
         image: "https://phache.com.vn/upload/gallery/cach-lam-tra-sua-olong-ngon.jpg", price: 38000, category: 'tra-sua' },

      // Chiên
      { name: 'Khoai tây chiên', description: 'Khoai tây chiên giòn, kèm tương cà và phô mai',
        image:"https://th.bing.com/th/id/OIP.mipkfWqCLJT21YzFT1h3FwHaEL?w=279&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3", price: 25000, category: 'chien' },
      { name: 'Bánh gối', description: 'Bánh gối nhân thịt, giòn tan thơm lừng',
        image:"https://th.bing.com/th/id/OIP.lr43C7hFzI2Fi1eSzEbBZgHaEK?w=293&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3" ,price: 20000, category: 'chien' },
      { name: 'Nem rán', description: 'Nem rán truyền thống, nhân thịt và rau', 
        image:"https://th.bing.com/th/id/OIP.SuQcy1KKwUgGAHNzbs6iRwHaE8?w=254&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3",price: 30000, category: 'chien', isPromotion: true, promotionPrice: 22000, promotionEnd: promoEnd },
      { name: 'Cá viên chiên', description: 'Cá viên chiên giòn, chấm tương ớt', 
        image:"https://th.bing.com/th/id/OIP.SuQcy1KKwUgGAHNzbs6iRwHaE8?w=254&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3",price: 25000, category: 'chien' },
      {name:"Bánh xào",description:"Bánh xèo giòn rụm, nhân tôm thịt, ăn kèm rau sống và nước mắm chua ngọt",
        image:"https://www.tastingtable.com/img/gallery/bnh-xo-the-delectable-vietnamese-crepes-you-should-know/l-intro-1666117324.jpg",price:100000 , category:'chien'},

      // Pho bun
      { name: 'Phở bò tái', description: 'Phở bò tái nạm gầu, nước dùng hầm xương 12 tiếng',
        image:"https://th.bing.com/th/id/OIP.xgyeyD_eRNAYY9rpSiZCsQHaFs?w=233&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3", price: 45000, category: 'pho-bun' },
      { name: 'Bún bò Huế', description: 'Bún bò Huế cay nồng, đầy đủ topping',
        image:"https://th.bing.com/th/id/OIP.95l_pa6ZQHAv2KnGRKnBDgHaEK?w=315&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3", price: 50000, category: 'pho-bun', isPromotion: true, promotionPrice: 39000, promotionEnd: promoEnd },
      { name: 'Bún riêu cua', description: 'Bún riêu cua đồng nấu cà chua, đậu hũ chiên',
        image:"https://th.bing.com/th/id/OIP.J5gxVRwVObP0ewln1yC7ngHaEo?w=257&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3", price: 40000, category: 'pho-bun' },
      { name: 'Phở gà', description: 'Phở gà ta thả vườn, nước trong vị ngọt thanh',
         image:"https://th.bing.com/th/id/OIP.RqUryq78mhTBbYt5YRvavgHaE8?w=254&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3",price: 42000, category: 'pho-bun' },
      {name:'Bún Đậu Mắm Tôm', description: 'Bún đậu mắm tôm đặc sản Hà Nội, đậu hũ chiên giòn, chấm mắm tôm pha chua cay',
        image:"https://th.bing.com/th/id/OIP.2qW-Zi6pOV1zsWppjY50OQHaD3?w=342&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3",price:100000, category:'pho-bun'},

      // Com
      { name: 'Cơm tấm sườn bì', description: 'Cơm tấm sườn nướng than, bì, chả trứng', 
        image:"https://th.bing.com/th/id/OIP.-weopBDf4Cv4Pwo3dA2J9QHaEK?w=310&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3",price: 40000, category: 'com' },
      { name: 'Cơm gà xối mỡ', description: 'Gà chiên giòn xối mỡ, da giòn thịt mềm',
        image:"https://th.bing.com/th/id/OIP.6Gbn8dPc4sm5H_1MQC57cQHaEL?w=279&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3", price: 45000, category: 'com' },
      { name: 'Cơm chiên dương châu', description: 'Cơm chiên trứng, tôm, lạp xưởng, đậu Hà Lan', 
        image:"https://th.bing.com/th/id/OIP.NOuV34rof1TxPUAZ9WZI9AHaEc?w=303&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3",price: 38000, category: 'com', isPromotion: true, promotionPrice: 29000, promotionEnd: promoEnd },
      { name: 'Cơm rang bò lúc lắc', description: 'Cơm rang với bò Úc lúc lắc mềm ngọt', 
        image:"https://th.bing.com/th/id/OIP.ad5ViURttyG5m7C2isz4fQHaEJ?w=305&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3",price: 55000, category: 'com' },

      // Món ăn vặt
      { name: 'Bánh tráng trộn', description: 'Bánh tráng trộn sate, khô bò, trứng cút', 
        image:"https://th.bing.com/th/id/OIP.uYERNiVT5sDQ30mVgybiIgHaEc?w=277&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3",price: 20000, category: 'mon-an-vat' },
      { name: 'Xiên que', description: 'Xiên que đủ loại nướng sốt cay', 
        image:"https://th.bing.com/th/id/OIP.RsQx3NzbYDMk_VArxnQsMwHaGr?w=192&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3",price: 15000, category: 'mon-an-vat' },
      { name: 'Tokbokki', description: 'Bánh gạo Hàn Quốc sốt cay ngọt',
        image:"https://th.bing.com/th/id/OIP.7ZQR15V46d3tPPpdOqRPZQHaFT?w=227&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3", price: 35000, category: 'mon-an-vat', isPromotion: true, promotionPrice: 25000, promotionEnd: promoEnd },
      { name: 'Takoyaki', description: 'Bánh bạch tuộc kiểu Nhật, 6 viên',
        image:"https://th.bing.com/th/id/OIP.VSTd2UlKdt3UPQH7S-jAnQHaE8?w=272&h=181&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3" ,price: 30000, category: 'mon-an-vat' },

      // Nuoc
      { name: 'Nước cam ép', description: 'Cam tươi ép nguyên chất, giàu vitamin C',
        image:"https://tse1.explicit.bing.net/th/id/OIP.pj-aBXUgEdFb4KHJ_rtbIwHaFy?rs=1&pid=ImgDetMain&o=7&rm=3", price: 25000, category: 'nuoc' },
      { name: 'Sinh tố bơ', description: 'Bơ sáp dẻo béo, thêm sữa đặc',
        image:"https://th.bing.com/th/id/OIP.G1B5goGoAYdYfmOIdeYPrgHaE8?w=283&h=189&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3", price: 30000, category: 'nuoc' },
      { name: 'Coca Cola', description: 'Coca Cola lon 330ml mát lạnh',
        image:"https://th.bing.com/th/id/OIP.oil-osvsyJqUwJAphtn_wQHaKe?w=128&h=181&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3", price: 15000, category: 'nuoc' },
      { name: 'Nước chanh dây', description: 'Chanh dây tươi, ngọt chua sảng khoái', 
        image:"https://th.bing.com/th/id/OIP.7HmXB8r3Be6LJUIEUV3TOwHaE8?w=253&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3",price: 20000, category: 'nuoc' },

      // Lẩu
      { name: 'Lẩu Thái Tom Yum', description: 'Ẩu Thái chua cay, hải sản tươi ngon (2-3 người)', 
        image:"https://th.bing.com/th/id/OIP.Izu6riqZso-slyj7YM3ZNAHaFT?w=176&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3",price: 199000, category: 'lau', isPromotion: true, promotionPrice: 159000, promotionEnd: promoEnd },
      { name: 'Lẩu gà lá é', description: 'Gà ta nấu lá é thơm nức, rau rừng (2-3 người)',
        image:"https://icdn.24h.com.vn/upload/1-2024/images/2024-01-31/Cach-lam-lau-ga-la-e-ngon-kho-cuong-an-la-ghien-1-1706686789-471-width1284height963.jpg", price: 180000, category: 'lau' },
      { name: 'Lẩu hải sản', description: 'Lẩu hải sản tổng hợp: tôm, mực, cá, nghêu (3-4 người)',
        image:"https://th.bing.com/th/id/OIP.5NujKO75rjfAMBSaYWrodwHaEJ?w=282&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3", price: 250000, category: 'lau' },
      { name: 'Lẩu bò nhúng dấm', description: 'Bò Mỹ thái lát mỏng, nhúng dấm thanh ngọt (2-3 người)', 
        image:"https://th.bing.com/th/id/OIP.1OoztG25dzK29AEYR4dCTgHaEK?w=290&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3",price: 220000, category: 'lau' }
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
