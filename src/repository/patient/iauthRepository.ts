import { Iuser, IuserInput } from "../../model/userModel";

export interface IAuthRepository {
  createUser(userData: IuserInput): Promise<Iuser>;
  findUserByEmail(email: string): Promise<Iuser | null>;
  findUserByUsername(username: string): Promise<Iuser | null>;
  findUserById(id: string): Promise<Iuser | null>;
  updateUser(id: string, updateData: Partial<IuserInput>): Promise<Iuser | null>;


  updatePassword(id: string, hashedPassword: string): Promise<Iuser | null>;

}