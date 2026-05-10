import { Request, Response, NextFunction } from 'express';
import { auth } from '../lib/auth';
import { ApiResponse, ApiError, logger } from '@onetap/shared';




export const register = async (req: Request, res: Response, next: NextFunction) => {
  const { name, email, password, role, address, city, state, pincode, lat, lng } = req.body;

  if (!name || name.trim().length < 2) {
    return next(new ApiError(400, "Name must be at least 2 characters long"));
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return next(new ApiError(400, "Please provide a valid email address"));
  }

  if (!password || password.length < 8) {
    return next(new ApiError(400, "Password must be at least 8 characters long"));
  }


  // Role validation (optional, defaults to 'user' in Better Auth config if not provided)
  // const validRoles = ['user', 'vendor', 'seller', 'admin'];
  // if (role && !validRoles.includes(role)) {
  //   return next(new ApiError(400, `Invalid role. Must be one of: ${validRoles.join(', ')}`));
  // }



  try {
    logger.info(`Processing registration for: ${email} as ${role || 'user'}`);

    const response = await auth.api.signUpEmail({
      body: {
        email: email.toLowerCase(),
        password,
        name: name.trim(),
        role: role || 'user',
        location_address: address,
        location_city: city,
        location_state: state,
        location_pincode: pincode,
        location_lat: lat,
        location_lng: lng
      }
    });

    if (!response) {
      throw new ApiError(500, "An unexpected error occurred during registration");
    }


    return res.status(201).json(
      new ApiResponse(
        201,
        {
          user: {
            id: response.user.id,
            name: response.user.name,
            email: response.user.email,
            role: (response.user as any).role
          }
        },
        "User account created successfully"
      )
    );

  } catch (error: any) {
    logger.error(`Registration failed for ${email}: ${error.message}`);


    if (error.status === 422 || error.message?.includes("already exists")) {
      return next(new ApiError(409, "A user with this email already exists"));
    }

    next(new ApiError(error.statusCode || 500, error.message || "Failed to register user"));
  }
};




// Login 

export const login = async (req: Request, res: Response, next: NextFunction) => {
  logger.info(`Login route hit from IP: ${req.ip}`);

  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ApiError(400, "Email and password are required"));
  }

  try {
    logger.info(`Login attempt for: ${email}`);

    const result = await auth.api.signInEmail({
      body: {
        email: email.toLowerCase(),
        password,
      }
    });

    if (!result) {
      throw new ApiError(401, "Invalid email or password");
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          user: {
            id: result.user.id,
            name: result.user.name,
            email: result.user.email,
            role: (result.user as any).role
          },
          token: result.token
        },
        "Logged in successfully"
      )
    );

  } catch (error: any) {
    logger.error(`Login failed for ${email}: ${error.message}`);


    if (error.status === 401 || error.message?.includes("Invalid credentials")) {
      return next(new ApiError(401, "Invalid email or password"));
    }

    next(new ApiError(error.statusCode || 500, error.message || "An error occurred during login"));
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const session = (req as any).session;

    if (!user) {
      throw new ApiError(401, "User not found in session");
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        { user, session },
        "User profile retrieved successfully"
      )
    );
  } catch (error: any) {
    next(new ApiError(error.statusCode || 500, error.message || "Failed to retrieve user profile"));
  }
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  const {
    name,
    phone,
    location_address,
    location_city,
    location_state,
    location_pincode,
    interests,
    lat,
    lng
  } = req.body;

  try {
    const user = (req as any).user;
    logger.info(`Updating profile for user: ${user.email}`);


    const result = await auth.api.updateUser({
      body: {
        name: name?.trim(),
        phone,
        location_address,
        location_city,
        location_state,
        location_pincode,
        location_lat: lat,
        location_lng: lng,
        interests,
      },
      headers: req.headers as any
    });


    if (!result || !result.status) {
      throw new ApiError(400, "Failed to update profile details");
    }


    const updatedSession = await auth.api.getSession({
      headers: req.headers as any
    });

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          user: updatedSession?.user,
          session: updatedSession?.session
        },
        "Profile updated successfully"
      )
    );

  } catch (error: any) {
    logger.error(`Profile update failed: ${error.message}`);
    next(new ApiError(error.statusCode || 500, error.message || "An error occurred while updating the profile"));
  }
};
