// models/UserImages.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const User = require("./User");  

const UserImages = sequelize.define("UserImages", {
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
    },
    userId: {
        type: DataTypes.INTEGER(100),  
        allowNull: false,
    },
    imgUrl: {
        type: DataTypes.STRING(255),
        allowNull: false,
    }
}, {
    timestamps: false, 
    tableName: 'userimages',
});

// A kapcsolat beállítása: egy User-nek több képe lehet, és egy UserImage egy User-hez tartozik
UserImages.belongsTo(User, { foreignKey: 'userId' });  // Egy UserImage tartozik egy User-hez
User.hasMany(UserImages, { foreignKey: 'userId', as: 'images' });  // Egy User-nek lehet sok UserImage-je

module.exports = UserImages;
