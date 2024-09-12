import * as core from '@actions/core'
import {URL} from 'url'
import * as yaml from 'js-yaml'
import * as fs from 'fs'

export interface PortainerConfig {
  url: URL
  username: string
  password: string
  endpoint: number
}

export interface StackConfig {
  name: string
  file: string
  vars?: {[key: string]: string}
  updatePrune: boolean
  pullImage: boolean
}

export interface Config {
  portainer: PortainerConfig
  stack: StackConfig
  teams?: string[]
}

function parsePortainerConfig(): PortainerConfig {
  return {
    url: new URL(core.getInput('portainer-url', {required: true})),
    username: core.getInput('portainer-username', {required: true}),
    password: core.getInput('portainer-password', {required: true}),
    endpoint: parseInt(core.getInput('portainer-endpoint', {required: true}))
  }
}

function parseStackConfig(): StackConfig {
  const varsPath = core.getInput('stack-vars')
  let vars = {}

  if (fs.existsSync(varsPath)) {
    vars = yaml.safeLoad(fs.readFileSync(varsPath, 'utf-8')) as {
      [key: string]: string
    }
  } else if (varsPath) {
    vars = yaml.safeLoad(varsPath) as {
      [key: string]: string
    }
  }

  const filePath = core.getInput('stack-file', {required: true})
  const file = fs.readFileSync(filePath, 'utf-8')
  const updatePrune = core.getInput('stack-update-prune') === 'true'
  const pullImage = core.getInput('stack-pull-image') === 'true'

  return {
    name: core.getInput('stack-name'),
    file,
    vars,
    updatePrune,
    pullImage
  }
}

export function parse(): Config {
  const teams = core
    .getInput('teams')
    .split(',')
    .map(x => x.trim())
    .filter(x => !!x)

  return {
    portainer: parsePortainerConfig(),
    stack: parseStackConfig(),
    teams
  }
}
