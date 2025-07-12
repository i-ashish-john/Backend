import { IuserInput, Iuser } from "../../model/userModel";

export interface IAuthService {
  registerUser(userData: IuserInput): Promise<{ user: Iuser, accessToken: string, refreshToken: string }>;
  loginUser(email: string, password: string): Promise<{ user: Iuser, accessToken: string, refreshToken: string }>;
  logoutUser(userId: string): Promise<void>;
  refreshAccessToken(refreshToken: string): Promise<string>;
}