export interface IMsg {
  uid:     string
  content: string
}

export class ChatMessage {
  public id:        string
  public uid:       string
  public timestamp: number
  public content:   string

  public constructor(msg: IMsg) {
    this.uid       = msg.uid
    this.timestamp = new Date().getTime()
    this.content   = msg.content
    this.id        = `${msg.uid}-${this.timestamp}`
  }
}
