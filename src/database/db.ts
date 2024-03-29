import { Sequelize, DataTypes, Model } from 'sequelize';

export const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './data/paramsniper.sqlite',
  logging: false,
  pool: {
    max: 100,
    min: 5,
    acquire: 1000,
    idle: 10
  }
});


class TradeLogs extends Model { 
};
 
 
 
    
TradeLogs.init({
  // Model attributes are defined here
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  }, 
  tokenAddress: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  tokenSymbol: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  buyTime: {
    type: DataTypes.DATE,
    defaultValue:Date.now(),
    allowNull: false,
  },
  buyAmount: {
    type: DataTypes.NUMBER,
    defaultValue:0,
    allowNull: false,
  }, 
  avgBuyPrice: {
    type: DataTypes.NUMBER,
    defaultValue:0,
    allowNull: false,
  }, 
  tokenBalance: {
    type: DataTypes.NUMBER,
    defaultValue:0,
    allowNull: false,
  },  
  sellTime: {
    type: DataTypes.DATE,
    allowNull: true,
  }, 
  sellAmount: {
    type: DataTypes.NUMBER,
    defaultValue:0,
    allowNull: false,
  }, 
  sold: {
    type: DataTypes.BOOLEAN,
    defaultValue:false,
    allowNull: false,
  }, 
},
  {
    tableName: 'TradeLogs',
    sequelize,
  });

 
 
  
 
      
export {   TradeLogs };


