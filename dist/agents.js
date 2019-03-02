"use strict";
const pooler_1 = require("pooler");
const https_1 = require("https");
module.exports = pooler_1.NewPooler({
    async factory() {
        return new https_1.Agent({ keepAlive: true });
    },
    async destructor(agent) {
        agent.destroy();
    },
    is_ok_sync(agent) {
        // @ts-ignore
        return agent.freeSockets != 0;
    }
});
