# LacaFood

Ung dung dat mon an (React Native + Expo) gom 2 phan:
- Frontend mobile app cho khach hang, shipper, admin
- Backend Node.js + Express + MongoDB

## Tinh nang chinh

### Khach hang
- Dang ky / dang nhap bang username
- Xem menu theo danh muc
- Xem chi tiet mon va chon tuy chon (options/toppings)
- Gio hang theo tung cau hinh mon
- Ap ma khuyen mai
- Chon vi tri giao hang tren ban do
- Tinh phi ship, khoang cach, thoi gian giao du kien
- Thanh toan COD hoac QR
- Theo doi don hang

### Admin
- Quan ly don hang
- Gan shipper thu cong hoac random shipper dang ranh
- Them shipper moi
- Quan ly mon an: them / sua / xoa / bat tat khuyen mai
- Quan ly ma khuyen mai
- Quan ly su kien giam gia theo khung gio va danh sach mon

### Shipper
- Nhan don duoc giao
- Cap nhat vi tri giao hang realtime (Socket.IO)

## Cong nghe su dung
- Frontend: React Native 0.73, Expo SDK 50, React Navigation, react-native-maps, expo-location
- Backend: Node.js, Express, Mongoose, Socket.IO, Multer
- Database: MongoDB

## Cau truc thu muc

- backend
- frontend

## Yeu cau moi truong
- Node.js >= 18
- MongoDB local hoac cloud
- Android Studio emulator (neu chay Android)
- Expo CLI (qua npx expo)

## Cai dat nhanh

### 1) Clone va cai dependency

```bash
git clone <repo-url>
cd LacaFood
cd backend && npm install
cd ../frontend && npm install
```

### 2) Tao file env backend

Tao file backend/.env voi noi dung toi thieu:

```env
MONGO_URI=mongodb://localhost:27017/lacafood
JWT_SECRET=your_secret_key
PORT=5001
```

### 3) Seed du lieu mau (tuy chon)

```bash
cd backend
npm run seed
```

Tai khoan mau sau khi seed:
- Admin: username admin / password admin123
- Shipper 1: username shipper1 / password 123456
- Shipper 2: username shipper2 / password 123456

### 4) Chay backend

```bash
cd backend
npm start
```

Backend mac dinh: http://localhost:5001

### 5) Chay frontend

```bash
cd frontend
npx expo start -c
```

Trong emulator Android, app dang dung BASE_URL o frontend/api.js la:
- http://10.0.2.2:5001/api

Neu ban chay tren thiet bi that, doi BASE_URL theo IP LAN cua may chay backend.

## Thanh toan QR

Checkout da ho tro thanh toan QR:
- Chon phuong thuc QR trong man hinh thanh toan
- Quet ma QR hien tren app
- Xac nhan da chuyen khoan
- Dat don

Thong tin thanh toan duoc luu trong order:
- payMethod
- paymentStatus
- paymentRef

## Ban do giao hang

Checkout su dung tile map OSM va co bo loc:
- Gioi han ban kinh giao hang toi da 30km
- Chan vi tri bat thuong ngoai khu vuc Viet Nam
- Co nut ve vi tri quan va nut mo ban do ngoai

## Scripts

### Backend
- npm start: chay server
- npm run dev: chay bang nodemon
- npm run seed: tao du lieu mau

### Frontend
- npm start: expo start
- npm run android: expo run:android
- npm run ios: expo run:ios
- npm run web: expo start --web

## API chinh (tom tat)
- /api/auth
- /api/foods
- /api/events
- /api/promo
- /api/orders
- /api/users
- /api/stats

## Luu y
- Du an hien dang dung auth co ban (password plain text) de demo. Nen hash password truoc khi deploy production.
- Nen bo sung middleware auth/role cho cac route admin khi dua len moi truong that.
- Neu map trong emulator bi xam do mang/tile, dung nut mo ban do ngoai de fallback.

## License

MIT
