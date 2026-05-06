// // app/seed/seed-mongodb.ts
// import bcrypt from 'bcryptjs';
// import { connectDB, mongoose } from '@/app/lib/db/db-core';
// import dataModels from '@/app/lib/db/models';
// import { users, customers, invoices, revenue, products, posts as placeholderPosts } from '../lib/placeholder-data';
// import fs from 'fs';
// import path from 'path';
// import matter from 'gray-matter';
// // Import generation functions (to be added)
// // import { generateFlightsDB } from '@/app/lib/db/generateForDB/flights/generateFlights';
// // import { generateHotelsDB } from '@/app/lib/db/generateForDB/hotels/generateHotels';


// export async function seedMongoDB() {
//   console.log('🌱 Seeding MongoDB...');
//   await connectDB();

//   // Clear existing data (only models that exist)
//   const models = dataModels as any;
//   await Promise.all([
//     models.Comment?.deleteMany({}),
//     models.CommentReaction?.deleteMany({}),
//     models.PostReaction?.deleteMany({}),
//     models.Post?.deleteMany({}),
//     models.Product?.deleteMany({}),
//     models.Customer?.deleteMany({}),
//     models.Invoice?.deleteMany({}),
//     models.PasswordResetToken?.deleteMany({}),
//     models.Revenue?.deleteMany({}),
//     models.User?.deleteMany({}),
//     models.Subscription?.deleteMany({}),
//     models.AnonymousUser?.deleteMany({}),
//     models.FlightItinerary?.deleteMany({}),
//     models.FlightSegment?.deleteMany({}),
//     models.FlightSeat?.deleteMany({}),
//     models.Account?.deleteMany({}),
//     models.Airline?.deleteMany({}),
//     models.AirlineFlightPrice?.deleteMany({}),
//     models.Airport?.deleteMany({}),
//     models.FlightBooking?.deleteMany({}),
//     models.FlightReview?.deleteMany({}),
//     models.FlightPayment?.deleteMany({}),
//     models.HotelBooking?.deleteMany({}),
//     models.HotelRoom?.deleteMany({}),
//     models.HotelGuest?.deleteMany({}),
//     models.Hotel?.deleteMany({}),
//     models.HotelPayment?.deleteMany({}),
//     models.Passenger?.deleteMany({}),
//     models.HotelReview?.deleteMany({}),
//     models.Verification_Token?.deleteMany({}),
//     models.Session?.deleteMany({}),
//     models.Seat?.deleteMany({}),
//     models.Airplane?.deleteMany({}),
//     models.PromoCode?.deleteMany({}),
//     models.SearchHistory?.deleteMany({}),
//     models.WebsiteReview?.deleteMany({}),
//     models.WebsiteConfig?.deleteMany({}),
//     models.Analytic?.deleteMany({}),
//     // models.Reservation.deleteMany({}),
//     // models.Favourite.deleteMany({}),
//   ]);

//   // -- Users --
//   const userIdMap = new Map(); // email -> ObjectId
//   for (const user of users) {
//     const hashedPassword = await bcrypt.hash(user.password, 10);
//     const doc = await models.User.create({
//       name: user.name,
//       email: user.email,
//       password: hashedPassword,
//       email_verified: user.email_verified,
//       image: user.image,
//       phone: user.phone,
//       city: user.city,
//       about: user.about,
//       birth_date: user.birth_date ? new Date(user.birth_date) : undefined,
//       role: user.role || 'user',
//       firstName: user.firstName,
//       lastName: user.lastName,
//       coverImage: user.coverImage,
//       phoneNumbers: user.phoneNumbers || [],
//       emails: user.emails || [{ email: user.email, primary: true, emailVerifiedAt: user.email_verified ? new Date() : null }],
//       address: user.address,
//       customerId: user.customerId,
//       flightBookmarks: [],
//       hotelBookmarks: [],
//       rewardPoints: { totalPoints: 0, pointHistory: [] },
//     });
//     userIdMap.set(user.email, doc._id);
//   }

//   // -- Customers --
//   const customerUuidToId = new Map();
//   for (const customer of customers) {
//     const user_id = userIdMap.get(customer.email) || null;
//     const doc = await models.Customer.create({
//       name: customer.name,
//       email: customer.email,
//       image_url: customer.image_url,
//       user_id,
//       original_id: customer.id,
//     });
//     customerUuidToId.set(customer.id, doc._id);
//   }

//   // -- Invoices --
//   for (const invoice of invoices) {
//     const customerId = customerUuidToId.get(invoice.customer_id);
//     if (!customerId) {
//       console.warn(`Customer ${invoice.customer_id} not found, skipping invoice`);
//       continue;
//     }
//     const customer = await models.Customer.findById(customerId).lean();
//     if (!customer) {
//       console.warn(`Customer ${invoice.customer_id} not found after mapping, skipping invoice`);
//       continue;
//     }
//     await models.Invoice.create({
//       customer: {
//         id: customer._id,
//         name: customer.name,
//         email: customer.email,
//         image_url: customer.image_url,
//       },
//       amount: invoice.amount,
//       status: invoice.status,
//       date: new Date(invoice.date),
//     });
//   }

//   // -- Revenue --
//   for (const rev of revenue) {
//     await models.Revenue.create({
//       month: rev.month,
//       revenue: rev.revenue,
//     });
//   }

//   // -- Products --
//   for (const product of products) {
//     await models.Product.create({
//       name: product.name,
//       price: product.price,
//       image: product.image,
//       type: product.type,
//     });
//   }

//   // -- Placeholder Posts --
//   const adminId = userIdMap.get('postta@aol.com');
//   if (adminId) {
//     for (const post of placeholderPosts) {
//       await models.Post.create({
//         slug: post.slug,
//         user_id: adminId,
//         title: post.title,
//         content: post.content,
//         created_at: new Date(post.created_at),
//         updated_at: new Date(post.updated_at),
//         images: [],
//       });
//     }
//   }

//   // -- Posts from Markdown Files --
//   const postsDir = path.join(process.cwd(), 'app/content/posts');
//   if (fs.existsSync(postsDir)) {
//     const fileNames = fs.readdirSync(postsDir);
//     for (const fileName of fileNames) {
//       if (!fileName.endsWith('.md')) continue;
//       const slug = fileName.replace(/\.md$/, '');
//       const fullPath = path.join(postsDir, fileName);
//       const fileContents = fs.readFileSync(fullPath, 'utf8');
//       const { data, content } = matter(fileContents);
//       await models.Post.create({
//         slug,
//         user_id: adminId,
//         title: data.title,
//         content,
//         created_at: new Date(data.date),
//         updated_at: new Date(data.date),
//         images: [],
//       });
//     }
//   }
//   // TODO: Seed flights, hotels, etc. with sample data.
//   // Use the old project's generation functions.
//   // Example:
//   // const { flightItinerary, flightSegments, flightSeats } = await generateFlightsDB(...);
//   // await models.FlightItinerary.insertMany(flightItinerary);
//   // await models.FlightSegment.insertMany(flightSegments);
//   // await models.FlightSeat.insertMany(flightSeats);
//   // Similarly for hotels.
//   console.log('✅ MongoDB seeding complete.');
// }

// app/seed/seed-mongodb.ts
// app/seed/seed-mongodb.ts
import bcrypt from 'bcryptjs';
import { connectDB, mongoose } from '@/app/lib/db/db-core';
import dataModels from '@/app/lib/db/models';
import { users, customers, invoices, revenue, products, posts as placeholderPosts } from '../lib/placeholder-data';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

// Import flight generation functions and primary data
import {
  generateFlightsDB,
  generateAirportsDB,
  generateAirplanesDB,
  generateAirlinesDB,
  generateAirlineFlightPricesDB,
} from '@/app/lib/db/generateForDB/flights/generateFlights';
import { generateHotelsDB } from '@/app/lib/db/generateForDB/hotels/generateHotels';
import primaryAirportData from '@/app/lib/db/generateForDB/primaryData/airportsData.json';
import primaryAirplaneData from '@/app/lib/db/generateForDB/primaryData/airplaneData.json';
import primaryAirlineData from '@/app/lib/db/generateForDB/primaryData/airlinesData.json';

export async function seedMongoDB() {
  console.log('🌱 Seeding MongoDB...');
  await connectDB();

  const models = dataModels as any;

  // ------------------------------------------------------------------
  // 1. Clear existing data
  // ------------------------------------------------------------------
  await Promise.all([
    models.Comment?.deleteMany({}),
    models.CommentReaction?.deleteMany({}),
    models.PostReaction?.deleteMany({}),
    models.Post?.deleteMany({}),
    models.Product?.deleteMany({}),
    models.Customer?.deleteMany({}),
    models.Invoice?.deleteMany({}),
    models.PasswordResetToken?.deleteMany({}),
    models.Revenue?.deleteMany({}),
    models.User?.deleteMany({}),
    models.Subscription?.deleteMany({}),
    models.AnonymousUser?.deleteMany({}),
    models.FlightItinerary?.deleteMany({}),
    models.FlightSegment?.deleteMany({}),
    models.FlightSeat?.deleteMany({}),
    models.Account?.deleteMany({}),
    models.Airline?.deleteMany({}),
    models.AirlineFlightPrice?.deleteMany({}),
    models.Airport?.deleteMany({}),
    models.FlightBooking?.deleteMany({}),
    models.FlightReview?.deleteMany({}),
    models.FlightPayment?.deleteMany({}),
    models.HotelBooking?.deleteMany({}),
    models.HotelRoom?.deleteMany({}),
    models.HotelGuest?.deleteMany({}),
    models.Hotel?.deleteMany({}),
    models.HotelPayment?.deleteMany({}),
    models.Passenger?.deleteMany({}),
    models.HotelReview?.deleteMany({}),
    models.Verification_Token?.deleteMany({}),
    models.Session?.deleteMany({}),
    models.Seat?.deleteMany({}),
    models.Airplane?.deleteMany({}),
    models.PromoCode?.deleteMany({}),
    models.SearchHistory?.deleteMany({}),
    models.WebsiteReview?.deleteMany({}),
    models.WebsiteConfig?.deleteMany({}),
    models.Analytic?.deleteMany({}),
  ]);

  // ------------------------------------------------------------------
  // 2. Seed core data (users, customers, invoices, revenue, products, posts)
  //    (Your existing code – unchanged)
  // ------------------------------------------------------------------
  const userIdMap = new Map();
  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const doc = await models.User.create({
      name: user.name,
      email: user.email,
      password: hashedPassword,
      email_verified: user.email_verified,
      image: user.image,
      phone: user.phone,
      city: user.city,
      about: user.about,
      birth_date: user.birth_date ? new Date(user.birth_date) : undefined,
      role: user.role || 'user',
      firstName: user.firstName,
      lastName: user.lastName,
      coverImage: user.coverImage,
      phoneNumbers: user.phoneNumbers || [],
      emails: user.emails || [{ email: user.email, primary: true, emailVerifiedAt: user.email_verified ? new Date() : null }],
      address: user.address,
      customerId: user.customerId,
      flightBookmarks: [],
      hotelBookmarks: [],
      rewardPoints: { totalPoints: 0, pointHistory: [] },
    });
    userIdMap.set(user.email, doc._id);
  }

  const customerUuidToId = new Map();
  for (const customer of customers) {
    const user_id = userIdMap.get(customer.email) || null;
    const doc = await models.Customer.create({
      name: customer.name,
      email: customer.email,
      image_url: customer.image_url,
      user_id,
      original_id: customer.id,
    });
    customerUuidToId.set(customer.id, doc._id);
  }

  // -- Invoices --
  for (const invoice of invoices) {
    const customerId = customerUuidToId.get(invoice.customer_id);
    if (!customerId) {
      console.warn(`Customer ${invoice.customer_id} not found, skipping invoice`);
      continue;
    }
    const customer = await models.Customer.findById(customerId).lean();
    if (!customer) {
      console.warn(`Customer ${invoice.customer_id} not found after mapping, skipping invoice`);
      continue;
    }
    await models.Invoice.create({
      customer: {
        id: customer._id,
        name: customer.name,
        email: customer.email,
        image_url: customer.image_url,
      },
      amount: invoice.amount,
      status: invoice.status,
      date: new Date(invoice.date),
    });
  }

  for (const rev of revenue) {
    await models.Revenue.create({ month: rev.month, revenue: rev.revenue });
  }

  // -- Products --
  // for (const product of products) {
  //   await models.Product.create({
  //     name: product.name,
  //     price: product.price,
  //     image: product.image,
  //     type: product.type,
  //   });
  // }
  for (const product of products) {
    await models.Product.create(product);
  }

  const adminId = userIdMap.get('postta@aol.com');
  if (adminId) {
    for (const post of placeholderPosts) {
      await models.Post.create({
        slug: post.slug,
        user_id: adminId,
        title: post.title,
        content: post.content,
        created_at: new Date(post.created_at),
        updated_at: new Date(post.updated_at),
        images: [],
      });
    }
  }

  const postsDir = path.join(process.cwd(), 'app/content/posts');
  if (fs.existsSync(postsDir) && adminId) {
    const fileNames = fs.readdirSync(postsDir);
    for (const fileName of fileNames) {
      if (!fileName.endsWith('.md')) continue;
      const slug = fileName.replace(/\.md$/, '');
      const fullPath = path.join(postsDir, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const { data, content } = matter(fileContents);
      await models.Post.create({
        slug,
        user_id: adminId,
        title: data.title,
        content,
        created_at: new Date(data.date),
        updated_at: new Date(data.date),
        images: [],
      });
    }
  }

  // ------------------------------------------------------------------
  // 3. Generate and seed flights (using processed data)
  // ------------------------------------------------------------------
  console.log('   Generating flights data...');

  // Step 1: Process the raw data into MongoDB-ready documents
  const airportsData = await generateAirportsDB(primaryAirportData);
  const { airplaneData: airplanesData, seatData: seatsData } = await generateAirplanesDB(primaryAirplaneData);
  const airlinesData = await generateAirlinesDB(primaryAirlineData);
  const airlineFlightPricesData = await generateAirlineFlightPricesDB(primaryAirlineData);

  // Step 2: Generate 10 days of flight itineraries, segments, seats
  const flightsData = await generateFlightsDB(
    10,
    airportsData,
    airplanesData,
    airlinesData,
    airlineFlightPricesData
  );

  // Flatten results
  const flightItineraries: any[] = [];
  const flightSegments: any[] = [];
  const flightSeats: any[] = [];
  for (const day of flightsData) {
    flightItineraries.push(...day.flightItinerary);
    flightSegments.push(...day.flightSegments);
    flightSeats.push(...day.flightSeats);
  }

  if (flightItineraries.length) {
    await models.FlightItinerary.insertMany(flightItineraries);
    console.log(`   Inserted ${flightItineraries.length} flight itineraries.`);
  }
  if (flightSegments.length) {
    await models.FlightSegment.insertMany(flightSegments);
    console.log(`   Inserted ${flightSegments.length} flight segments.`);
  }
  if (flightSeats.length) {
    await models.FlightSeat.insertMany(flightSeats);
    console.log(`   Inserted ${flightSeats.length} flight seats.`);
  }

  // Also seed airlines, airports, airplanes (if not already inserted by the above)
  if (airportsData.length) {
    await models.Airport.insertMany(airportsData);
    console.log(`   Inserted ${airportsData.length} airports.`);
  }
  if (airlinesData.length) {
    await models.Airline.insertMany(airlinesData);
    console.log(`   Inserted ${airlinesData.length} airlines.`);
  }
  if (airplanesData.length) {
    await models.Airplane.insertMany(airplanesData);
    console.log(`   Inserted ${airplanesData.length} airplanes.`);
  }
  if (airlineFlightPricesData.length) {
    await models.AirlineFlightPrice.insertMany(airlineFlightPricesData);
    console.log(`   Inserted ${airlineFlightPricesData.length} airline flight prices.`);
  }
  if (seatsData?.length) {
    await models.Seat.insertMany(seatsData);
    console.log(`   Inserted ${seatsData.length} seats.`);
  }

  // ------------------------------------------------------------------
  // 4. Generate and seed hotels
  // ------------------------------------------------------------------
  console.log('   Generating hotels data...');
  const hotelsData = await generateHotelsDB();
  if (hotelsData.hotel.length) {
    await models.Hotel.insertMany(hotelsData.hotel);
    console.log(`   Inserted ${hotelsData.hotel.length} hotels.`);
  }
  if (hotelsData.hotelRoom.length) {
    await models.HotelRoom.insertMany(hotelsData.hotelRoom);
    console.log(`   Inserted ${hotelsData.hotelRoom.length} hotel rooms.`);
  }

  console.log('✅ MongoDB seeding complete.');
}