import { EntityRepository, Repository } from 'typeorm';
import { UserEntity } from '@app/user/entity/user.entity';
import { HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

@EntityRepository(UserEntity)
export class UserRepository {
  constructor(
    @InjectRepository(UserEntity)
    public readonly repo: Repository<UserEntity>,
  ) {}

  async save(user: UserEntity): Promise<UserEntity> {
    return await this.repo.save(user);
  }

  async remove(user: UserEntity): Promise<UserEntity> {
    return await this.repo.remove(user);
  }

  getById = async (id: string): Promise<UserEntity> => {
    const user = await this.repo.findOne(id);
    if (!user) {
      throw new HttpException("User wasn't found by ID", HttpStatus.NOT_FOUND);
    }
    return user;
  };

  findByEmail = async (email: string): Promise<UserEntity | null> => {
    return await this.repo.findOne({ email });
  };

  findByEmailForLogin = async (email: string): Promise<UserEntity | null> => {
    return await this.repo.findOne({
      where: {
        email,
      },
      select: ['id', 'email', 'password', 'status'],
    });
  };

  async getAll(): Promise<UserEntity[]> {
    return await this.repo.find();
  }
}
