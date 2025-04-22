const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');

class Swipe extends Model {}

Swipe.init(
  {
    id: {
      type: DataTypes.BIGINT(20).UNSIGNED,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    swiper_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users', 
        key: 'id',
      },
    },
    swiped_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users', 
        key: 'id',
      },
    },
    direction: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [['left', 'right']], 
      },
    },
  },
  {
    sequelize,
    modelName: 'Swipe',
    tableName: 'swipes',
    timestamps: true,
  }
);

// Kapcsolatok beállítása
Swipe.belongsTo(User, { foreignKey: 'swiper_id', as: 'swiper' });
Swipe.belongsTo(User, { foreignKey: 'swiped_id', as: 'swiped' });

module.exports = Swipe;