// models/ChatMessage.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const User = require("./User");
const Match = require("./Match");

const ChatMessage = sequelize.define("ChatMessage", {
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
    },
    match_id: { 
        type: DataTypes.BIGINT.UNSIGNED, 
        allowNull: false,
        references: {
            model: Match,
            key: 'id'
        }
    },
    sender_id: {
        type: DataTypes.BIGINT.UNSIGNED, 
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        }
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
}, {
    timestamps: true,
    updatedAt: false,
    tableName: 'Messages'
});


ChatMessage.belongsTo(Match, { foreignKey: 'match_id' });
Match.hasMany(ChatMessage, { foreignKey: 'match_id' });

ChatMessage.belongsTo(User, { foreignKey: 'sender_id', as: 'sender' });
User.hasMany(ChatMessage, { foreignKey: 'sender_id' });

module.exports = ChatMessage;