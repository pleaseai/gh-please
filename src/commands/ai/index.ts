import { Command } from 'commander'
import { createApplyCommand } from './apply'
import { createFixCommand } from './fix'
import { createInvestigateCommand } from './investigate'
import { createReviewCommand } from './review'
import { createTriageCommand } from './triage'

export function createAiCommand(): Command {
  const command = new Command('ai')

  command.description('Trigger PleaseAI workflows')

  command.addCommand(createTriageCommand())
  command.addCommand(createInvestigateCommand())
  command.addCommand(createFixCommand())
  command.addCommand(createReviewCommand())
  command.addCommand(createApplyCommand())

  return command
}
