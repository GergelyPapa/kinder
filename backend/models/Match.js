// models/Match.js

const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User'); 

class Match extends Model {}

Match.init(
  {
    id: {
      type: DataTypes.BIGINT(20).UNSIGNED,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    user1_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users', 
        key: 'id',
      },
    },
    user2_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users', 
        key: 'id',
      },
    },
  },
  {
    sequelize,
    modelName: 'Match',
    tableName: 'matches', 
    timestamps: false, 
  }
);

// Kapcsolatok beállítása
Match.belongsTo(User, { foreignKey: 'user1_id', as: 'user1' }); // A párosítás egyik felhasználója
Match.belongsTo(User, { foreignKey: 'user2_id', as: 'user2' }); // A párosítás másik felhasználója

// A `User` modellhez való kapcsolódás beállítása
User.hasMany(Match, { foreignKey: 'user1_id', as: 'user1Matches' });
User.hasMany(Match, { foreignKey: 'user2_id', as: 'user2Matches' });

module.exports = Match;
