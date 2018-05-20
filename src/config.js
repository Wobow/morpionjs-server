import process from 'process';

const devConfig = {
  port: 8080,
  bodyLimit: '100kb',
  corsHeaders: ['Link'],
  mongoDB: 'mongodb://localhost/dev_morbak',
  secret: 'laturlute',
};

const prodConfig = {
  port: 8081,
  bodyLimit: '100kb',
  corsHeaders: ['Link'],
  mongoDB: 'mongodb://localhost/prod_morbak',
  secret: 'laturlute',
};

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'dev';
}

const config = process.env.NODE_ENV === 'production' ? prodConfig : devConfig;

export default config;
