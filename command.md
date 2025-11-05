npm install

# Generate Prisma client
npx prisma generate

# Create SQLite database
npx prisma db push

# Seed initial data (creates admin user)
npx prisma db seed

# Development mode (with auto-restart)
npm run dev

# OR Production mode
npm start

-----------------------------------
npm init -y 
npm i express prisma @prisma/client bcryptjs jsonwebtoken joi cors helmet morgan express-rate-limit uuid dotenv 
npm i -D nodemon eslint prettier @types/node 
npx prisma init 
npm run dev 

npx prisma generate 
npm run dev 
curl http://localhost:3000/health 