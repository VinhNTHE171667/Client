import { DataSourceOptions } from 'typeorm';
import { DataSource } from 'typeorm';
// import glob from 'fast-glob';

// const entityPaths = glob.sync('src/entities/*.entity.{ts,js}');

export const dataSourceOptions: DataSourceOptions = {
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  username: 'root',
  password: 'root',
  database: 'gen_spa',
  entities: [__dirname + '/../entities/*.entity.{js,ts}'],
  migrations: [__dirname + '/migrations/*.{js,ts}'],
  migrationsTableName: 'migrations',
  synchronize: false,
  migrationsRun: false,
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
