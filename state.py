from typing import Annotated, Optional
from typing_extensions import TypedDict
from langgraph.graph.message import add_messages


class State (TypedDict):

  query: str
  messages: Annotated[list, add_messages]
  content: Optional[list[str]]
  rewritten_query: Optional[str]
  response: Optional[str]
  image: Optional[bytes]