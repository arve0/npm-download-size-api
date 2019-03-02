import { NewPooler } from 'pooler'
import { Agent } from 'https'

export = NewPooler({
    async factory () {
        return new Agent({ keepAlive: true })
    },
    async destructor (agent: Agent) {
        agent.destroy()
    },
    is_ok_sync (agent: Agent) {
        // @ts-ignore
        return agent.freeSockets != 0
    }
})
