import * as core from '@actions/core'
import * as config from './config'
import {PortainerClient} from './portainer'

async function run(): Promise<void> {
  try {
    const cfg = config.parse()
    core.debug(`parsed config: ${JSON.stringify(cfg)}`)

    core.startGroup('Auth')
    const portainer = new PortainerClient(cfg.portainer.url)
    await portainer.login(cfg.portainer.username, cfg.portainer.password)
    core.endGroup()

    core.startGroup('Get State')
    core.info(`get current swarm id of endpoint #${cfg.portainer.endpoint}`)
    const swarm = await portainer.getSwarm(cfg.portainer.endpoint)

    core.info(`get stacks of swarm cluster ${swarm.id}`)
    const stacks = await portainer.getStacks(swarm.id)

    const stack = stacks.find(item => item.name === cfg.stack.name)
    core.endGroup()

    if (stack) {
      core.startGroup(`Update stack (id: ${stack.id})`)

      const file = await portainer.getStackFile(stack.id)
      const vars: Record<string, string> = {}
      for (const {name, value} of stack.env) {
        vars[name] = value
      }

      await portainer.updateStack({
        id: stack.id,
        endpointId: cfg.portainer.endpoint,
        stack: file,
        vars: {...vars, ...(cfg.stack.vars || {})},
        prune: cfg.stack.updatePrune,
        pull: cfg.stack.pullImage
      })

      core.endGroup()

      core.setOutput('stack-id', stack.id)
    } else {
      core.setFailed(`Stack ${cfg.stack.name} not found!`)
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
