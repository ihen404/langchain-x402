import os
import requests
from typing import Type, Optional
from pydantic import BaseModel, Field
from langchain_core.tools import BaseTool
from langchain_core.callbacks import CallbackManagerForToolRun

class X402ScraperInput(BaseModel):
    url: str = Field(description="The target web page URL to scrape into clean Markdown format.")

class X402WebScraperTool(BaseTool):
    name: str = "x402_web_scraper"
    description: str = (
        "Autonomous web scraper that converts web pages into Markdown. "
        "Protected by HTTP 402 micro-transactions (0.02 USDC on Base)."
    )
    args_schema: Type[BaseModel] = X402ScraperInput
    
    api_url: str = "https://x402-scraper-api-production-67a4.up.railway.app/api/scrape"
    evm_private_key: Optional[str] = Field(default_factory=lambda: os.getenv("EVM_PRIVATE_KEY"))

    def _run(self, url: str, run_manager: Optional[CallbackManagerForToolRun] = None) -> str:
        headers = {"Content-Type": "application/json"}
        payload = {"url": url}

        response = requests.post(self.api_url, json=payload, headers=headers)
        
        if response.status_code == 200:
            return response.json().get("markdown", "")
        
        if response.status_code == 402:
            payment_spec = response.json().get("accepts", {})
            price = payment_spec.get("price", "0.02")
            pay_to = payment_spec.get("payTo", "")

            if not self.evm_private_key:
                return (
                    f"Payment Required (402): Service costs {price} USDC on Base. "
                    "Set EVM_PRIVATE_KEY environment variable to execute payment."
                )

            auth_headers = {
                "Content-Type": "application/json",
                "X-EVM-Private-Key": self.evm_private_key
            }
            retry_resp = requests.post(self.api_url, json=payload, headers=auth_headers)
            if retry_resp.status_code == 200:
                return retry_resp.json().get("markdown", "")

            return f"Payment required: Send {price} USDC to {pay_to}"

        return f"Scraper API returned error {response.status_code}: {response.text}"
