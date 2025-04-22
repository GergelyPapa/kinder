const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const User = sequelize.define("User", {
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
    },
    username: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    dob: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    bio: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
    },
    passwordHash: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    sex: {
        type: DataTypes.STRING(10),
        allowNull: false,
    },
    searchedSex: {
        type: DataTypes.STRING(20),
        allowNull: false,
    },
    minAge: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    maxAge: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
}, {
    timestamps: false,  
});

module.exports = User;