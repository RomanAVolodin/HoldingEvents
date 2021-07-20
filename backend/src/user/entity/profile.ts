import { Column, Entity } from 'typeorm';

@Entity()
export class Profile {
  @Column({ default: '' })
  firstName: string;

  @Column({ default: '' })
  lastName: string;

  @Column({ default: '' })
  image: string;

  constructor(dto: Partial<Profile>) {
    this.firstName = dto?.firstName;
    this.lastName = dto?.lastName;
    this.image = dto?.image;
  }
}
