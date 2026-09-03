import os
import requests
from typing import Type, Optional
from pydantic import BaseModel, Field
from langchain_core.tools import BaseTool
from langchain_core.callbacks import CallbackManagerForToolRun

class X402ScraperInput(BaseModel):
    url: str = Field(description="The target web page URL to scrape into clean Markdown format.")
    tx_hash: Optional[str] = Field(default=None, description="Optional confirmed Base USDC transaction hash for x402 payment.")

class X402WebScraperTool(BaseTool):
    name: str = "x402_web_scraper"
    description: str = (
        "Autonomous web scraper that converts web pages into Markdown. "
        "Protected by HTTP 402 micro-transactions (0.02 USDC on Base)."
    )
    args_schema: Type[BaseModel] = X402ScraperInput
    
    api_url: str = "https://x402-scraper-api-production-67a4.up.railway.app/api/scrape"
    evm_private_key: Optional[str] = Field(default_factory=lambda: os.getenv("EVM_PRIVATE_KEY"))
    rpc_url: str = "https://mainnet.base.org"

    def _execute_usdc_transfer(self, pay_to: str, amount_usdc: str) -> Optional[str]:
        """Broadcasts an ERC-20 USDC transfer on Base network and returns the tx_hash."""
        if not self.evm_private_key:
            return None
            
        try:
            from web3 import Web3
            w3 = Web3(Web3.HTTPProvider(self.rpc_url))
            if not w3.is_connected():
                return None

            key = self.evm_private_key.strip()
            if not key.startswith("0x"):
                key = "0x" + key

            account = w3.eth.account.from_key(key)
            usdc_address = Web3.to_checksum_address("0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913")
            
            abi = [{
                "constant": False,
                "inputs": [
                    {"name": "_to", "type": "address"},
                    {"name": "_value", "type": "uint256"}
                ],
                "name": "transfer",
                "outputs": [{"name": "", "type": "bool"}],
                "type": "function"
            }]

            contract = w3.eth.contract(address=usdc_address, abi=abi)
            amount_units = int(float(amount_usdc) * 1e6)
            
            nonce = w3.eth.get_transaction_count(account.address)
            tx = contract.functions.transfer(
                Web3.to_checksum_address(pay_to),
                amount_units
            ).build_transaction({
                'chainId': 8453,
                'gas': 100000,
                'maxFeePerGas': w3.eth.gas_price,
                'maxPriorityFeePerGas': w3.to_wei('0.001', 'gwei'),
                'nonce': nonce,
            })

            signed_tx = w3.eth.account.sign_transaction(tx, private_key=key)
            tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
            receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=60)
            
            if receipt.status == 1:
                return tx_hash.hex()
        except Exception:
            return None
        return None

    def _run(self, url: str, tx_hash: Optional[str] = None, run_manager: Optional[CallbackManagerForToolRun] = None) -> str:
        payload = {"url": url}

        # Handle direct tx_hash submission
        if tx_hash:
            auth_headers = {"Content-Type": "application/json", "X-Payment": tx_hash}
            res = requests.post(self.api_url, json=payload, headers=auth_headers)
            if res.status_code == 200:
                return res.json().get("markdown", "")
            return f"Payment Verification Failed ({res.status_code}): {res.text}"

        response = requests.post(self.api_url, json=payload, headers={"Content-Type": "application/json"})
        
        if response.status_code == 200:
            return response.json().get("markdown", "")
        
        if response.status_code == 402:
            payment_spec = response.json().get("accepts", {})
            price = payment_spec.get("price", "0.02")
            pay_to = payment_spec.get("payTo", "")

            # Attempt automated on-chain execution if EVM_PRIVATE_KEY is set
            confirmed_tx_hash = self._execute_usdc_transfer(pay_to, price)
            if confirmed_tx_hash:
                auth_headers = {"Content-Type": "application/json", "X-Payment": confirmed_tx_hash}
                retry_resp = requests.post(self.api_url, json=payload, headers=auth_headers)
                if retry_resp.status_code == 200:
                    return retry_resp.json().get("markdown", "")

            return f"Payment required: Send {price} USDC to {pay_to}"

        return f"Scraper API returned error {response.status_code}: {response.text}"
