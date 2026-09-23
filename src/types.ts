export type TopicId =
  | 'ethics'
  | 'quant'
  | 'economics'
  | 'fsa'
  | 'corporate'
  | 'equity'
  | 'fixed-income'
  | 'derivatives'
  | 'alternatives'
  | 'portfolio'

export type Difficulty = 'easy' | 'medium' | 'hard'

export type EthicsKind = 'violation' | 'compliance' | 'concept'

export type HardTopicHelp = {
  blurb: string
  youtubeUrl: string
  youtubeTitle: string
  channel: string
}

export type Question = {
  id: string
  topicId: TopicId
  losIds: string[]
  difficulty: Difficulty
  stem: string
  choices: [string, string, string]
  correctIndex: 0 | 1 | 2
  explanation: string
  ethicsStandard?: string
  ethicsKind?: EthicsKind
  hardTopicHelp?: HardTopicHelp
}

export type LosModule = {
  id: string
  title: string
  summary: string
}

export type TopicHelp = {
  blurb: string
  youtubeUrl: string
  youtubeTitle: string
  channel: string
}

export type Topic = {
  id: TopicId
  code: string
  name: string
  shortName: string
  session: 1 | 2
  weightMin: number
  weightMax: number
  hard: boolean
  summary: string
  bankTarget: number
  help?: TopicHelp
  los: LosModule[]
}
