import { DataSourceOptions } from 'typeorm';
import { DataSource } from 'typeorm';
// import glob from 'fast-glob';

// const entityPaths = glob.sync('src/entities/*.entity.{ts,js}');
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306;
const DB_USER = process.env.DB_USERNAME || process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || 'root';
const DB_NAME = process.env.DB_DATABASE || process.env.DB_NAME || 'gen_spa';
export const dataSourceOptions: DataSourceOptions = {
  type: 'mysql',
  host: '34.142.150.3',
  port: 33061,
  username: 'root',
  password: 'root',
  database: 'gen_spa',
  entities: [__dirname + '/../entities/*.entity.{js,ts}'],
  migrations: [__dirname + '/migrations/*.{js,ts}'],
  migrationsTableName: 'migrations',
  // synchronize: true,  // Temporarily set to true to create tables
  migrationsRun: false,
};

// export const dataSourceOptions: DataSourceOptions = {
//   type: 'mysql',
//   host: 'localhost',
//   port: 3306,
//   username: 'root',
//   password: '',
//   database: 'gen_spa',
//   entities: [__dirname + '/../entities/*.entity.{js,ts}'],
//   migrations: [__dirname + '/migrations/*.{js,ts}'],
//   migrationsTableName: 'migrations',
//   synchronize: false,
//   migrationsRun: false,
// };
const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
