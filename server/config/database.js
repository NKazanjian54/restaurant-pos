const knex = require("knex");

const db = knex({
  client: "pg",
  connection: {
    host: "aws-0-us-east-2.pooler.supabase.com",
    port: 5432,
    user: "postgres.zroyslglclzgexunbbie",
    password: "#BakedPotatoes54",
    database: "postgres",
    ssl: { rejectUnauthorized: false },
  },
  pool: {
    min: 2,
    max: 10,
  },
});

// Test connection
const testConnection = async () => {
  try {
    console.log("🔗 Connecting via Session Pooler...");
    const result = await db.raw("SELECT NOW() as current_time");
    console.log("✅ Database connected successfully!");
    console.log("✅ Database time:", result.rows[0].current_time);

    // Verify users table
    const userCount = await db("users").count("* as count");
    console.log("✅ Users table accessible, count:", userCount[0].count);
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    process.exit(1);
  }
};

testConnection();

module.exports = db;
