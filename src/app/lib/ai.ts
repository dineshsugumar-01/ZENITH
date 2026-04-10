import { dataService, Vendor } from "./data";
import { authService } from "./auth";

export interface AIResult {
  success: boolean;
  data?: any;
  error?: string;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const aiService = {

  // COMPANY FEATURES

  // 1. Section 43B(h) Profit-Shield - MSME Tax Compliance
  async analyze43BH(vendorId: string, invoiceAmount: number, invoiceDate: string): Promise<AIResult> {
    await delay(1500);
    
    const vendor = dataService.getVendorById(vendorId);
    const isMSME = vendor?.category === "Raw Materials" || vendor?.category === "Electronics";
    
    const invoiceDateObj = new Date(invoiceDate);
    const deadline = new Date(invoiceDateObj);
    deadline.setDate(deadline.getDate() + 45);
    
    const taxAtRisk = isMSME ? Math.round(invoiceAmount * 0.30) : 0;
    
    return {
      success: true,
      data: {
        is_msme: isMSME,
        deadline: deadline.toISOString().split('T')[0],
        tax_at_risk: isMSME ? `₹${taxAtRisk.toLocaleString()} (30% of total)` : "Not applicable",
        vendor_name: vendor?.companyName || "Unknown",
        category: vendor?.category || "Unknown",
        recommendation: isMSME ? "Payment within 45 days required to claim tax deduction" : "Standard payment terms apply",
        compliance_status: isMSME ? "MSME Protected" : "Non-MSME"
      }
    };
  },

  // 2. Anticipatory Sourcing Agent - Supply Chain Risk
  async analyzeSupplyChainRisk(materialName: string): Promise<AIResult> {
    await delay(2000);
    
    const mockRisks: Record<string, any> = {
      "steel": { risk_level: "High", reason: "Iron ore prices surged 12% this month due to supply constraints in Odisha. Transport strike in Karnataka affecting deliveries.", suggested_action: "Buy Now", price_trend: "+12%", delivery_impact: "2-3 weeks delay" },
      "copper": { risk_level: "Medium", reason: "Global copper prices volatile. Import duty changes expected next month.", suggested_action: "Buy within 7 days", price_trend: "+5%", delivery_impact: "1 week delay" },
      "electronics": { risk_level: "High", reason: "Semiconductor shortage continuing. Taiwan export controls tightening.", suggested_action: "Buy Now", price_trend: "+18%", delivery_impact: "4-6 weeks delay" },
      "default": { risk_level: "Low", reason: "Stable supply chain for this material. No major disruptions reported.", suggested_action: "Standard procurement", price_trend: "Stable", delivery_impact: "Normal" }
    };
    
    const materialKey = materialName.toLowerCase().split(" ")[0];
    const riskData = mockRisks[materialKey] || mockRisks["default"];
    
    return {
      success: true,
      data: {
        material: materialName,
        ...riskData,
        news_sources: ["Industrial Times", "Business Standard", "Trade India"],
        alternatives: ["Import from Vietnam", "Local substitute available"]
      }
    };
  },

  // 3. BRSR Green Auditor - ESG Compliance
  async analyzeESG(vendorId: string): Promise<AIResult> {
    await delay(1800);
    
    const vendor = dataService.getVendorById(vendorId);
    
    return {
      success: true,
      data: {
        vendor_name: vendor?.companyName || "Unknown",
        dpiit_recognition: vendor?.verificationStatus === "verified",
        esg_metrics: {
          carbon_footprint: {
            value: Math.floor(Math.random() * 100) + 50,
            unit: "tonnes CO2/year",
            compliance_score: Math.floor(Math.random() * 30) + 70
          },
          energy_efficiency: {
            value: Math.floor(Math.random() * 40) + 60,
            unit: "kWh/unit",
            compliance_score: Math.floor(Math.random() * 25) + 75
          },
          waste_management: {
            value: Math.floor(Math.random() * 20) + 80,
            unit: "% recycling",
            compliance_score: Math.floor(Math.random() * 20) + 80
          },
          water_usage: {
            value: Math.floor(Math.random() * 5000) + 10000,
            unit: "liters/day",
            compliance_score: Math.floor(Math.random() * 30) + 70
          }
        },
        brsr_score: Math.floor(Math.random() * 30) + 70,
        compliance_status: "SEBI BRSR Compliant",
        next_audit_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }
    };
  },

  // 4. DPI/Startup India Bridge - Startup Verification
  async verifyStartupIndia(vendorName: string): Promise<AIResult> {
    await delay(1500);
    
    const vendors = dataService.getAllVendors();
    const vendor = vendors.find(v => v.companyName.toLowerCase().includes(vendorName.toLowerCase()));
    
    const isStartup = vendor?.category === "Electronics" || vendor?.category === "IT Services";
    
    return {
      success: true,
      data: {
        search_query: vendorName,
        is_verified: isStartup,
        dpiit_no: isStartup ? `DPIIT-${Math.random().toString(36).substr(2, 8).toUpperCase()}` : null,
        startup_india_certified: isStartup,
        certification_date: isStartup ? "2024-06-15" : null,
        trust_score: isStartup ? 85 : 45,
        make_in_india_benefits: isStartup ? ["5% price preference in government tenders", "Tax benefits under Section 80IAC", "Fast-track patent approval"] : ["Standard procurement terms apply"],
        verification_source: "Startup India Portal (Mock)"
      }
    };
  },

  // VENDOR FEATURES
  // 6. TReDS-Linked Cash - Invoice Discounting Guide
  async generateTReDSMessage(invoiceAmount: number, invoiceNumber: string, vendorName: string): Promise<AIResult> {
    await delay(1200);
    
    const discountRate = 0.02;
    const discountAmount = Math.round(invoiceAmount * discountRate);
    const netAmount = invoiceAmount - discountAmount;
    const processingTime = "24 hours";
    
    return {
      success: true,
      data: {
        original_invoice: {
          number: invoiceNumber,
          amount: invoiceAmount,
          currency: "INR"
        },
        treds_offer: {
          discount_rate: `${(discountRate * 100).toFixed(1)}%`,
          discount_amount: discountAmount,
          net_payable: netAmount,
          processing_time: processingTime,
          platform: "Mynd/Treds/Receivable"
        },
        whatsapp_message: `Hi ${vendorName}! 📢\n\nGreat news! Your invoice #${invoiceNumber} for ₹${invoiceAmount.toLocaleString()} can be converted to instant cash!\n\n💰 Get ₹${netAmount.toLocaleString()} in just 24 hours\n⏰ No more waiting 45 days\n✅ No collateral needed\n\nReply YES to avail this offer or call our financing partner.`,
        savings_vs_waiting: {
          interest_saved: discountAmount,
          time_saved: "44 days"
        }
      }
    };
  },

  // 7. ONDC & e-Rupee Mesh - Smart Contract Logic
  async generateSmartContract(orderId: string, amount: number, vendorWallet: string): Promise<AIResult> {
    await delay(1500);
    
    return {
      success: true,
      data: {
        contract_id: `SC-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
        order_reference: orderId,
        amount_locked: amount,
        currency: "INR (e-Rupee)",
        trigger_conditions: {
          ondc_delivery: {
            event: "ONDC Logistics status = 'Delivered'",
            source: "Logistics Provider API",
            verification: "Digital signature confirmation"
          },
          payment_release: {
            action: "Transfer from Escrow to Vendor Wallet",
            wallet_address: vendorWallet,
            automatic: true
          }
        },
        pseudocode: `
contract OrderPayment {
    // State: Funds locked in escrow
    uint256 lockedAmount = ${amount};
    address vendorWallet = "${vendorWallet}";
    bool delivered = false;
    
    // Trigger: ONDC marks as delivered
    function onDeliveryConfirmed() public {
        require(ONDC.verifyDelivery() == true);
        delivered = true;
        
        // Action: Release e-Rupee
        if(delivered && !released) {
            transferToVendor(vendorWallet, lockedAmount);
            emit FundsReleased(vendorWallet, lockedAmount);
        }
    }
}`,
        benefits: [
          "Instant payment on delivery confirmation",
          "No manual invoice processing",
          "Dispute resolution via smart contract",
          "Complete transparency for both parties"
        ],
        status: "Smart Contract Deployed"
      }
    };
  },

  // 8. Gemini Custom Query Solve
  async solveQuery(query: string, customPrompt: string): Promise<AIResult> {
    const user = authService.getCurrentUser();
    
    // Non-AI Mock Chatbot for Demo Accounts
    if (authService.isDemo()) {
      await delay(1000);
      return { 
        success: true, 
        data: { 
          response: "[NON-AI DEMO MODE]\n\n" +
                    "1. BEST VENDOR:\n" +
                    "* Name: AlloyIndia Pvt Ltd\n" +
                    "* Distance: 12 km\n" +
                    "* Price: 42,000 INR\n" +
                    "* Delivery: 2 Days\n" +
                    "* Stock Status: Available\n" +
                    "* Score: 94/100\n\n" +
                    "2. TOP 3 VENDORS (ranked)\n" +
                    "- AlloyIndia Pvt Ltd\n" +
                    "- SteelTech Industries\n" +
                    "- BuildCorp India\n\n" +
                    "3. AI INSIGHT:\n" +
                    "AlloyIndia provides the optimal balance of price and proximity, avoiding the 100km penalty while offering competitive fast-tracking.\n\n" +
                    "4. WARNINGS (if any):\n" +
                    "* None."
        } 
      };
    }

    try {
      const res = await fetch("/api/v1/ai/query-solve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, custom_prompt: customPrompt })
      });
      if (res.ok) {
        const data = await res.json();
        return { success: data.success, data: { response: data.response } };
      }
      return { success: false, data: { response: "Request failed to reach AI server." }};
    } catch (e) {
      return { 
        success: false, 
        data: { 
          response: `Mock Response [Backend Unreachable]. You instructed the AI with: '${customPrompt}'. If I had my API running, I would have answered your query '${query}' using that persona.` 
        } 
      };
    }
  }
};
