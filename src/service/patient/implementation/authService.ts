import { IAuthService } from "../iauthService";
import { IAuthRepository } from "../../../repository/patient/iauthRepository";
import { ITokenRepository } from "../../../repository/patient/itokenRepository";
import { IuserInput, Iuser } from "../../../model/userModel";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

export class AuthService implements IAuthService {
  private readonly _authRepository: IAuthRepository;
  private readonly _tokenRepository: ITokenRepository;

  constructor(authRepository: IAuthRepository, tokenRepository: ITokenRepository) {
    this._authRepository = authRepository;
    this._tokenRepository = tokenRepository;
  }

  private generateAccessToken(userId: string): string {
    console.log('Generating access token for userId:', userId);
    return jwt.sign(
      { userId },
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
        throw new Error("Invalid user data provided");
      }

      const existingUserByEmail = await this._authRepository.findUserByEmail(userData.email);
      if (existingUserByEmail) {
        throw new Error('Email already registered');
      }

      const existingUserByUsername = await this._authRepository.findUserByUsername(userData.username);
      if (existingUserByUsername) {
        throw new Error('Username already taken');
      }

      const salt = await bcrypt.genSalt(10); // hash before storing
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      // Create new user with hashed password
      const newUser = await this._authRepository.createUser({
        ...userData,
        password: hashedPassword
      });

      // Generate tokens
      const accessToken = this.generateAccessToken((newUser._id as string).toString());
      const refreshToken = this.generateRefreshToken((newUser._id as string).toString());

      await this._tokenRepository.storeRefreshToken((newUser._id as string).toString(), refreshToken);

      return {
        user: newUser,
        accessToken,
        refreshToken,
      };
    } catch (error: any) {
      throw new Error(error.message || 'Registration failed');
    }
  }

  async loginUser(email: string, password: string): Promise<{ user: Iuser, accessToken: string, refreshToken: string }> {
    try {
      // Find user by email
      const user = await this._authRepository.findUserByEmail(email);
      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }

      const accessToken = this.generateAccessToken((user._id as string).toString());
      const refreshToken = this.generateRefreshToken((user._id as string).toString());

      // Store refresh token in Redis
      await this._tokenRepository.storeRefreshToken((user._id as string).toString(), refreshToken);

      return {
        user,
        accessToken,
        refreshToken
      };
    } catch (error: any) {
      throw new Error(error.message || 'Login failed');
    }
  }

  async logoutUser(userId: string): Promise<void> {
    try {
      // Delete refresh token from Redis
      await this._tokenRepository.deleteRefreshToken(userId);
    } catch (error: any) {
      throw new Error(error.message || 'Logout failed');
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<string> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET as string) as { userId: string };
      
      // Get stored refresh token from Redis
      const storedToken = await this._tokenRepository.getRefreshToken(decoded.userId);
      if (!storedToken || storedToken !== refreshToken) {
        throw new Error('Invalid refresh token');
      }

      // Generate new access token
      return this.generateAccessToken(decoded.userId);
    } catch (error: any) {
      throw new Error(error.message || 'Token refresh failed');
    }
  }
}