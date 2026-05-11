import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import mongoose from "mongoose";
import { betterAuth as authConfig } from "@onetap/shared";
import { bearer } from "better-auth/plugins";

export const auth = betterAuth({
    database: mongodbAdapter(mongoose.connection.db as any),
    secret: authConfig.secret,
    baseURL: authConfig.url,

    user: {
        additionalFields: {
            phone: { type: "string", required: false },
            role: { type: "string", defaultValue: "user" },
            location_address: { type: "string", required: false },
            location_city: { type: "string", required: false },
            location_state: { type: "string", required: false },
            location_pincode: { type: "string", required: false },
            location_lat: { type: "number", required: false },
            location_lng: { type: "number", required: false },
            aadhaarVerified: { type: "boolean", defaultValue: false },
            isSellerApproved: { type: "boolean", defaultValue: false },
            interests: { type: "string", required: false },
        }
    },
    emailAndPassword: {
        enabled: true
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        },
    },
    plugins: [
        bearer()
    ],
    databaseHooks: {
        user: {
            create: {
                before: async (user) => {
                    // Properly structure the location object for the DB
                    if (user.location_lat !== undefined && user.location_lng !== undefined) {
                        (user as any).location = {
                            address: user.location_address,
                            city: user.location_city,
                            state: user.location_state,
                            pincode: user.location_pincode,
                            geo: {
                                type: "Point",
                                coordinates: [user.location_lng, user.location_lat] // [longitude, latitude]
                            }
                        };
                        
                        // Optional: Remove the temporary flat fields from the database document
                        delete user.location_address;
                        delete user.location_city;
                        delete user.location_state;
                        delete user.location_pincode;
                        delete user.location_lat;
                        delete user.location_lng;
                    }
                    return { data: user };
                }
            },
            update: {
                before: async (user) => {
                    // Apply same logic for updates
                    const updateData = user.data as any;
                    if (updateData.location_lat !== undefined || updateData.location_lng !== undefined) {
                        updateData.location = {
                            ...(updateData.location || {}),
                            address: updateData.location_address || updateData.location?.address,
                            city: updateData.location_city || updateData.location?.city,
                            state: updateData.location_state || updateData.location?.state,
                            pincode: updateData.location_pincode || updateData.location?.pincode,
                            geo: {
                                type: "Point",
                                coordinates: [
                                    updateData.location_lng ?? updateData.location?.geo?.coordinates[0],
                                    updateData.location_lat ?? updateData.location?.geo?.coordinates[1]
                                ]
                            }
                        };
                        
                        delete updateData.location_address;
                        delete updateData.location_city;
                        delete updateData.location_state;
                        delete updateData.location_pincode;
                        delete updateData.location_lat;
                        delete updateData.location_lng;
                    }
                    return { data: updateData };
                }
            }
        }
    }
});
