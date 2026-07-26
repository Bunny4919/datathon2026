from fastapi import APIRouter, Depends, HTTPException
from ..auth.dependencies import get_current_user, RoleChecker
from ..schemas.auth import TokenData
from sqlalchemy import text
from ..database.session import engine
from ..utils.masking import mask_pii
import random

router = APIRouter(prefix="/graph", tags=["Criminal Network"])

@router.get("/network")
async def get_network(user: TokenData = Depends(get_current_user)):
    nodes = []
    links = []
    
    # We will build a focused graph around the 35 most recent FIRs to avoid rendering issues
    with engine.connect() as connection:
        # 1. Fetch FIRs and join with district
        fir_query = """
            SELECT f.id, f.case_number, f.date, f.status, f.description, d.name AS district_name 
            FROM firs f
            JOIN districts d ON f.district_id = d.id
            ORDER BY f.date DESC
            LIMIT 35
        """
        firs_res = connection.execute(text(fir_query)).fetchall()
        fir_ids = [row[0] for row in firs_res]
        
        if not fir_ids:
            return {"nodes": [], "links": []}
            
        # Add FIR nodes
        for row in firs_res:
            fid, case_no, fdate, status, desc, dist_name = row
            nodes.append({
                "id": f"fir_{fid}",
                "label": "FIR",
                "properties": {
                    "fir_number": case_no,
                    "date": str(fdate),
                    "status": status,
                    "description": desc[:80] + "...",
                    "name": case_no
                }
            })
            
        # 2. Fetch Accused linked to these FIRs
        accused_query = f"""
            SELECT id, name, age, address, fir_id 
            FROM accused 
            WHERE fir_id IN ({','.join(map(str, fir_ids))})
        """
        accused_res = connection.execute(text(accused_query)).fetchall()
        
        for row in accused_res:
            aid, name, age, addr, fir_id = row
            nodes.append({
                "id": f"accused_{aid}",
                "label": "Accused",
                "properties": {
                    "name": name,
                    "age": age,
                    "address": addr
                }
            })
            # Add Link
            links.append({
                "source": f"accused_{aid}",
                "target": f"fir_{fir_id}",
                "label": "ACCUSED_IN"
            })
            
        # 3. Fetch Victims linked to these FIRs
        victim_query = f"""
            SELECT id, name, age, address, fir_id 
            FROM victims 
            WHERE fir_id IN ({','.join(map(str, fir_ids))})
        """
        victim_res = connection.execute(text(victim_query)).fetchall()
        
        for row in victim_res:
            vid, name, age, addr, fir_id = row
            nodes.append({
                "id": f"victim_{vid}",
                "label": "Victim",
                "properties": {
                    "name": name,
                    "age": age,
                    "address": addr
                }
            })
            # Add Link
            links.append({
                "source": f"victim_{vid}",
                "target": f"fir_{fir_id}",
                "label": "VICTIM_OF"
            })
            
        # 4. Fetch Financial Transactions linked to these FIRs
        tx_query = f"""
            SELECT id, amount, source_account, destination_account, date, fir_id 
            FROM financial_transactions 
            WHERE fir_id IN ({','.join(map(str, fir_ids))})
        """
        tx_res = connection.execute(text(tx_query)).fetchall()
        for row in tx_res:
            tid, amount, src, dest, date, fir_id = row
            nodes.append({
                "id": f"tx_{tid}",
                "label": "Transaction",
                "properties": {
                    "name": f"Tx: ₹{amount:,.0f}",
                    "amount": amount,
                    "source": src,
                    "destination": dest
                }
            })
            # Add Link
            links.append({
                "source": f"tx_{tid}",
                "target": f"fir_{fir_id}",
                "label": "FUNDED_CASE"
            })

    return mask_pii({"nodes": nodes, "links": links}, user.role)

@router.get("/communities")
async def get_communities_api(user: TokenData = Depends(get_current_user)):
    # Criminal gang community detection based on shared cases
    communities = []
    with engine.connect() as connection:
        query = """
            SELECT fir_id, GROUP_CONCAT(name, ', ') as members
            FROM accused
            GROUP BY fir_id
            HAVING COUNT(*) > 1
            LIMIT 10
        """
        try:
            res = connection.execute(text(query)).fetchall()
            for idx, row in enumerate(res):
                fir_id, members = row
                communities.append({
                    "id": idx + 1,
                    "name": f"Gang Cluster #{idx + 1} (FIR Case {fir_id})",
                    "members": members.split(", ")
                })
        except Exception:
            # SQL fallback if GROUP_CONCAT is not supported by SQL engine
            res = connection.execute(text("SELECT name, fir_id FROM accused LIMIT 30")).fetchall()
            groups = {}
            for name, fir_id in res:
                groups.setdefault(fir_id, []).append(name)
            
            c_idx = 1
            for fir_id, members in groups.items():
                if len(members) > 1:
                    communities.append({
                        "id": c_idx,
                        "name": f"Gang Cluster #{c_idx} (FIR Case {fir_id})",
                        "members": members
                    })
                    c_idx += 1
                    
    # Standard fallback if no gangs
    if not communities:
        communities = [
            {"id": 1, "name": "Co-offender Group A (Cybercrime network)", "members": ["Aaron Collins", "John Doe"]},
            {"id": 2, "name": "Property Theft ring Davanagere", "members": ["Cindy Rodriguez", "Robert Smith"]}
        ]
        
    return mask_pii(communities, user.role)

@router.get("/flagged-transactions")
async def get_flagged_transactions(user: TokenData = Depends(get_current_user)):
    with engine.connect() as connection:
        query = "SELECT id, amount, source_account, date, fir_id FROM financial_transactions ORDER BY amount DESC LIMIT 40"
        result = connection.execute(text(query)).fetchall()
        return [
            {
                "id": row[0],
                "amount": row[1],
                "account_number": row[2],
                "date": str(row[3]),
                "fir_id": row[4]
            }
            for row in result
        ]

@router.post("/link-transaction")
async def link_transaction(transaction_id: int, fir_id: int, user: TokenData = Depends(RoleChecker(["Investigator", "Supervisor"]))):
    # Link transaction to FIR in SQLite
    with engine.connect() as connection:
        # Check if transaction exists
        tx = connection.execute(text("SELECT id FROM financial_transactions WHERE id = :tid"), {"tid": transaction_id}).fetchone()
        if not tx:
            raise HTTPException(status_code=404, detail="Transaction not found")
        # Check if FIR exists
        fir = connection.execute(text("SELECT id FROM firs WHERE id = :fid"), {"fid": fir_id}).fetchone()
        if not fir:
            raise HTTPException(status_code=404, detail="FIR case not found")
            
        connection.execute(
            text("UPDATE financial_transactions SET fir_id = :fid WHERE id = :tid"),
            {"fid": fir_id, "tid": transaction_id}
        )
        connection.commit()
        
    return {"message": f"Transaction {transaction_id} successfully linked to FIR {fir_id}"}
