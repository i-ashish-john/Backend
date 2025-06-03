import { IAuthService } from "../iauthService";
import { IAuthRepository } from "../../../repository/patient/iauthRepository";
import { ITokenRepository } from "../../../repository/patient/itokenRepository";
import { IuserInput, Iuser } from "../../../model/userModel";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

import { HttpStatusCode } from "../../../config/ HttpStatusCode.enum";


export class AuthService implements IAuthService {
  private readonly _authRepository: IAuthRepository;
  private readonly _tokenRepository: ITokenRepository;

  constructor(authRepository: IAuthRepository, tokenRepository: ITokenRepository) {
    this._authRepository = authRepository;
    this._tokenRepository = tokenRepository;
  }

  private generateAccessToken(user: Iuser): string {
    return jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_ACCESS_SECRET as string,
      { expiresIn: '15m' }
    );
  }

  private generateRefreshToken(userId: string): string {
    console.log('Generating refresh token for userId:', userId);
    return jwt.sign(
      { userId },
      process.env.JWT_REFRESH_SECRET as string,
      { expiresIn: '7d' } // Longer-lived token
    );
  }

  async registerUser(userData: IuserInput): Promise<{ user: Iuser, accessToken: string, refreshToken: string }> {
    try {
      if (!userData.username || !userData.email || !userData.password) {
        throw { 
          message: "Invalid user data provided", 
          statusCode: HttpStatusCode.BAD_REQUEST 
        };
      }

      const existingUserByEmail = await this._authRepository.findUserByEmail(userData.email);
      if (existingUserByEmail) {
        throw { 
          message: 'Email already registered', 
          statusCode: HttpStatusCode.BAD_REQUEST 
        };
      }

      const existingUserByUsername = await this._authRepository.findUserByUsername(userData.username);
      if (existingUserByUsername) {
        throw { 
          message: 'Username already taken', 
          statusCode: HttpStatusCode.BAD_REQUEST 
        };
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      const newUser: Iuser = await this._authRepository.createUser({
        ...userData,
        password: hashedPassword // creatin role also defaultly
      });
      // (newUser._id as string)
      const accessToken = this.generateAccessToken(newUser);
      const refreshToken = this.generateRefreshToken((newUser._id as string).toString());

      await this._tokenRepository.storeRefreshToken((newUser._id as string).toString(),(newUser.username as string).toString(), refreshToken);

      return { user: newUser, accessToken, refreshToken };

    } catch (error: any) {
      if (error.statusCode) {
        throw error;
      } else {
        throw { 
          message: error.message || 'Registration failed', 
          statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR 
        };
      }
    }
  }
  

  async loginUser(email: string, password: string): Promise<{ user: Iuser, accessToken: string, refreshToken: string }> {
    try {
      const user = await this._authRepository.findUserByEmail(email) as Iuser;
      if (!user) {
        throw { 
          message: 'Invalid email or password', 
          statusCode: HttpStatusCode.UNAUTHORIZED 
        };
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw { 
          message: 'Invalid email or password', 
          statusCode: HttpStatusCode.UNAUTHORIZED 
        };
      }

      const accessToken = this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken((user._id as string).toString());

      await this._tokenRepository.storeRefreshToken((user._id as string).toString(), (user.username as string).toString(),refreshToken);

      return { user, accessToken, refreshToken };
      
    } catch (error: any) {
      if (error.statusCode) {
        throw error;
      } else {
        throw { 
          message: error.message || 'Login failed', 
          statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR 
        };
      }
    }
  }

  async logoutUser(userId: string): Promise<void> {
    try {
      await this._tokenRepository.deleteRefreshToken(userId);
    } catch (error: any) {
      throw { 
        message: error.message || 'Logout failed', 
        statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR 
      };
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<string> {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET as string) as { userId: string };
      const storedToken = await this._tokenRepository.getRefreshToken(decoded.userId);
      
      if (!storedToken || storedToken !== refreshToken) {
        throw { 
          message: 'Invalid refresh token', 
          statusCode: HttpStatusCode.UNAUTHORIZED 
        };
      }

      const user = await this._authRepository.findUserById(decoded.userId) as Iuser;
      if (!user) {
        throw { 
          message: 'User not found (from authService)', 
          statusCode: HttpStatusCode.UNAUTHORIZED 
        };
      }
      return this.generateAccessToken(user);

    } catch (error: any) {
      if (error.statusCode) {
        throw error;
      } else {
        throw { 
          message: error.message || 'Token refresh failed', 
          statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR 
        };
      }

    }

  }

}