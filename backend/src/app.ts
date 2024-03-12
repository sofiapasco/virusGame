import cors from "cors";
import express from "express";
import morgan from "morgan";
import routes from "./routes";
import path from "path";

// Detect environment
const NODE_ENV = process.env.NODE_ENV || "development";

// Path to frontend build
const frontendDistPath = path.join(
	__dirname,
	NODE_ENV === "production"
		? "../../../../frontend/dist"
		: "../../frontend/dist"
);

console.log("🌱 Environment:", NODE_ENV);
console.log("🚚 Path to frontend build:", frontendDistPath);

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Serve frontend
app.use(express.static(frontendDistPath));

// Use dem routes
//app.use(routes);

export default app;
