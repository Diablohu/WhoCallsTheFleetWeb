const Sequelize = require("sequelize");
const sequelize = new Sequelize(process.env.FLEET_CONN_STR, {
    define: {
        charset: 'utf8',
        collate: 'utf8_general_ci',
        underscored: false,
        freezeTableName: true,
        timestamps: true,
        paranoid: true
    }
});

const db = {
    Sequelize: Sequelize,
    sequelize: sequelize
};

var model;
// FleetSession
model = sequelize.define('FleetSession', {
    sid: {
        type: Sequelize.STRING,
        primaryKey: true
    },
    expires: {
        type: Sequelize.DATE,
        allowNull: true
    },
    data: Sequelize.TEXT
}, {
    timestamps: false,
    paranoid: false
});
db[model.getTableName()] = model;
// FleetUser
model = sequelize.define('FleetUser', {
    id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.UUIDV4
    },
    duoshuoId: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    name: {
        type: Sequelize.STRING,
        allowNull: false
    }
}, {
    defaultScope: {
        where: {
            deletedAt: null
        }
    }
});
db[model.getTableName()] = model;

sequelize.sync().then(function() {
    console.log('Database initialized.');
});

module.exports = function(app) {
    app.db = db;
};
