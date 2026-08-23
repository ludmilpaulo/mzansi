"""Seed catalogue of public FAQ items for immigration guidance.

Each item is (category, question, answer). Categories align with the public FAQ UI.
Answers are professional guidance only — never a guarantee of approval — and should
be reviewed against current South African immigration requirements before publication.
"""

from __future__ import annotations

FAQ_ITEMS: list[tuple[str, str, str]] = [
    # --- GENERAL ---
    (
        "general",
        "What immigration services does Mzansi Visa Solutions provide?",
        "Mzansi Visa Solutions provides professional immigration assistance for South African "
        "visa, permit, waiver and permanent residence matters. Typical services include "
        "consultations, category guidance, document checklists and review, application "
        "preparation support, client-portal case management, and coordination guidance for "
        "lodging channels such as VFS where applicable. We provide professional assistance "
        "and administrative support; we do not decide applications. Final decisions remain "
        "with the Department of Home Affairs (DHA) or the relevant government authority.",
    ),
    (
        "general",
        "Can Mzansi Visa Solutions guarantee my visa approval?",
        "No. Mzansi Visa Solutions does not guarantee the approval, issuance, extension, "
        "renewal or outcome of any visa, permit, waiver, permanent residence application or "
        "other immigration application. Final decisions are made solely by the relevant "
        "government authority.",
    ),
    (
        "general",
        "How does the immigration consultation work?",
        "You book a consultation (guests can book without logging in), share your situation "
        "and goals, and a consultant conducts an initial assessment. We discuss possible "
        "categories under current published rules, typical evidence, risks and recommended "
        "next steps. A consultation is advisory guidance — it is not a Home Affairs "
        "appointment and does not guarantee any outcome.",
    ),
    (
        "general",
        "Can I book a consultation without creating an account?",
        "Yes. Visitors can book a consultation directly through the website without first "
        "logging in. After booking, a client account is typically created for you and you "
        "receive an activation email so you can access the portal.",
    ),
    (
        "general",
        "Do I need to be in South Africa to use your services?",
        "Not always. Many matters can be prepared remotely, and lodging often happens through "
        "a visa facilitation centre or mission in the country where you are lawfully present. "
        "Whether you must be inside or outside South Africa depends on the category, your "
        "current status and the official instructions in force. We confirm this during "
        "assessment against current requirements.",
    ),
    (
        "general",
        "Can you help me determine which visa may be appropriate?",
        "Yes. Through a consultation we assess your circumstances and provide professional "
        "guidance on categories that may fit under applicable South African immigration law "
        "and published requirements. Category fit depends on your facts and current rules; "
        "we do not guarantee that any particular category will be approved.",
    ),
    (
        "general",
        "How long does an immigration application take?",
        "Processing times vary by category, workload and the relevant authority’s systems. "
        "Mzansi does not control government or VFS queues and cannot guarantee a decision "
        "date. We share known published estimates where available and help you prepare a "
        "complete file so avoidable delays are reduced.",
    ),
    (
        "general",
        "Can I apply for a visa while already in South Africa?",
        "It depends on the visa category, your current immigration status and the rules in "
        "force at the time. Some applications may be lodged from within South Africa; others "
        "require lodging abroad. Confirm the correct channel in consultation against current "
        "official instructions — we do not create pathways that do not exist in law.",
    ),
    (
        "general",
        "Can I change my visa status while in South Africa?",
        "A change of status or category may be possible in some situations and not in others. "
        "It depends on your current permit or visa, the target category and applicable "
        "regulations. Seek advice before your current status expires; overstaying can have "
        "serious consequences.",
    ),
    (
        "general",
        "What happens if my visa expires?",
        "If your visa or permit is about to expire — or has expired — seek professional advice "
        "promptly and avoid remaining in South Africa without lawful status. Overstaying can "
        "lead to enforcement action, future refusals or other immigration consequences. "
        "Mzansi can help you understand options; we cannot erase an overstay or guarantee "
        "a remedy.",
    ),
    # --- WORK ---
    (
        "work",
        "What is a South African work visa?",
        "A South African work visa (temporary residence for work) authorises a foreign "
        "national to work in South Africa subject to the conditions of the specific category "
        "granted. Common pathways discussed with clients include critical skills and general "
        "work routes, among others published under the Immigration Act and regulations. "
        "The correct category depends on your skills, offer of employment and current rules.",
    ),
    (
        "work",
        "What is a Critical Skills Work Visa?",
        "A Critical Skills Work Visa is a temporary residence category aimed at occupations "
        "identified on South Africa’s published critical skills framework. Eligibility, "
        "qualifications recognition and evidence requirements change over time. Always verify "
        "the current critical skills list and supporting requirements with official sources; "
        "Mzansi can help you prepare against the list in force for your matter.",
    ),
    (
        "work",
        "What is a General Work Visa?",
        "A General Work Visa is typically used where an employer seeks to employ a foreign "
        "national in a position that is not covered by another specialised work category. "
        "Eligibility usually involves employer-related processes and evidence set out in "
        "current regulations. Approval is never guaranteed and depends on the authority’s "
        "assessment of your file.",
    ),
    (
        "work",
        "What documents are normally required for a work visa?",
        "Requirements depend on the work category and your personal circumstances. Files often "
        "include a valid passport, photographs, employment-related letters, qualifications "
        "evidence and category-specific supporting documents. Police clearances, medical "
        "reports or other items may also apply. We maintain a live checklist on your "
        "application; always confirm against current DHA/VFS instructions before lodging.",
    ),
    (
        "work",
        "Can I change employers while holding a South African work visa?",
        "It depends on the visa category and the conditions endorsed on your permit. Some "
        "work authorisations are tied to a specific employer or position. Changing employers "
        "without the correct authorisation can breach your status. Discuss any planned change "
        "with a consultant before you move roles.",
    ),
    (
        "work",
        "Can my family accompany me if I receive a work visa?",
        "Family members may have separate immigration pathways (for example as dependents) "
        "depending on their relationship to you, their ages and the applicable category. "
        "Each family member generally needs their own appropriate status. Eligibility and "
        "evidence requirements are assessed individually; approval is not guaranteed.",
    ),
    (
        "work",
        "Can I work in South Africa on a visitor visa?",
        "A visitor visa does not automatically authorise employment. You must comply with the "
        "conditions of your immigration status. Working without the correct authorisation can "
        "have serious consequences. If you intend to work, discuss the appropriate work "
        "category before you start employment.",
    ),
    (
        "work",
        "Can an employer sponsor my application?",
        "Many work categories involve an employer who provides a job offer and supporting "
        "documents. The degree of employer involvement depends on the category and current "
        "rules. Even with strong employer support, the decision remains with the Department "
        "of Home Affairs — neither the employer nor Mzansi can guarantee approval.",
    ),
    # --- PERMANENT RESIDENCE ---
    (
        "permanent-residence",
        "What is permanent residence in South Africa?",
        "Permanent residence is a long-term immigration status that, if granted, allows a "
        "foreign national to reside in South Africa on a more enduring basis than temporary "
        "visas, subject to the conditions and law applicable to permanent residents. It is "
        "distinct from citizenship. Categories and evidence requirements are set out in "
        "legislation and regulations that can change.",
    ),
    (
        "permanent-residence",
        "Who may qualify for permanent residence?",
        "Eligibility depends on the legal category relied upon (for example work-related, "
        "family-related or other published grounds) and on your individual circumstances. "
        "Meeting high-level criteria does not guarantee approval. A consultation helps map "
        "your facts against current requirements without promising an outcome.",
    ),
    (
        "permanent-residence",
        "What documents are required for permanent residence?",
        "Document requirements vary by permanent residence category and personal history. "
        "Typical files may include identity and civil-status documents, police clearances, "
        "proof of lawful status and category-specific evidence. Exact lists are published by "
        "the authorities and can change. We build a matter-specific checklist; we cannot "
        "guarantee that every submitted document will be accepted.",
    ),
    (
        "permanent-residence",
        "How long does permanent residence take?",
        "Government processing times for permanent residence vary widely and are controlled "
        "by the Department of Home Affairs. Mzansi cannot accelerate official queues or "
        "guarantee a decision date. We help you lodge a complete, well-organised file and "
        "keep you informed of status updates where available.",
    ),
    (
        "permanent-residence",
        "Can I apply for permanent residence while living in South Africa?",
        "In many cases applicants already holding temporary residence explore permanent "
        "residence from within South Africa, but eligibility and lodging procedure depend on "
        "the category and current rules. Confirm the correct process before you apply; "
        "incorrect lodging can cause refusal or delay.",
    ),
    (
        "permanent-residence",
        "Can my spouse or children qualify through my permanent residence application?",
        "Family members may qualify under specific family or dependent provisions, or may "
        "need separate applications, depending on the legal framework and their relationship "
        "to the principal applicant. Each person’s eligibility is assessed on its own facts. "
        "Approval for one family member does not guarantee approval for others.",
    ),
    (
        "permanent-residence",
        "Does permanent residence mean I automatically become a South African citizen?",
        "No. Permanent residence and South African citizenship are separate legal statuses. "
        "Holding permanent residence does not automatically confer citizenship. Citizenship "
        "has its own legal requirements and process if and when you become eligible to apply.",
    ),
    # --- WAIVERS ---
    (
        "waivers",
        "What is an immigration waiver?",
        "In immigration practice, a waiver or exemption request generally asks the authorities "
        "to dispense with or relax a specific requirement in defined circumstances. It is not "
        "an automatic solution and is not available for every problem. Whether a waiver "
        "pathway exists depends on the law and your facts.",
    ),
    (
        "waivers",
        "When might a waiver be relevant?",
        "A waiver may be discussed where a specific legal or documentary requirement is "
        "difficult to meet and the applicable framework contemplates discretionary relief. "
        "Relevance depends entirely on your immigration history, current status and the "
        "requirement involved. We assess this carefully; we never present a waiver as a "
        "guaranteed fix.",
    ),
    (
        "waivers",
        "Can Mzansi guarantee a waiver approval?",
        "No. Waiver and exemption outcomes are decided by the relevant government authority. "
        "Mzansi provides professional preparation and guidance only and does not guarantee "
        "approval of any waiver or related request.",
    ),
    (
        "waivers",
        "What information is needed to assess a waiver matter?",
        "A consultant typically needs your immigration history, current status, the reason "
        "for the request, prior refusals or compliance issues if any, and supporting "
        "documents that explain why relief is sought. Incomplete history can undermine an "
        "assessment — disclose relevant facts early.",
    ),
    # --- VISITOR ---
    (
        "visitor",
        "What is a South African visitor visa?",
        "A visitor visa authorises a temporary stay in South Africa for purposes permitted "
        "under visitor conditions — commonly tourism, visiting family or short business "
        "visits as allowed by the endorsement. It is not a substitute for a work, study or "
        "residence permit unless the applicable authorisation expressly allows that activity.",
    ),
    (
        "visitor",
        "Can I work on a visitor visa?",
        "No, unless the applicable immigration authorisation expressly permits the activity. "
        "Ordinary visitor conditions do not authorise employment. If you need to work, pursue "
        "the correct work category before commencing employment.",
    ),
    (
        "visitor",
        "Can I study on a visitor visa?",
        "Study permissions depend on the applicable rules, the length and nature of the "
        "programme, and the conditions of your stay. Longer or formal study often requires a "
        "study visa. Confirm before you enrol; studying outside your conditions can have "
        "immigration consequences.",
    ),
    (
        "visitor",
        "Can I extend my stay in South Africa?",
        "Extensions or further visitor authorisation may be possible in some cases and not in "
        "others. It depends on your current visa conditions, timing and applicable law. Apply "
        "in good time before expiry; remaining after expiry can constitute an overstay.",
    ),
    (
        "visitor",
        "What happens if I overstay my visa?",
        "Overstaying can have serious immigration consequences, including enforcement action "
        "and difficulty obtaining future visas. Address the situation promptly with "
        "professional advice. Mzansi can help you understand options; we cannot guarantee "
        "that any particular remedy will succeed.",
    ),
    # --- STUDY ---
    (
        "study",
        "What is a South African study visa?",
        "A study visa authorises a foreign national to undertake studies at an eligible "
        "South African institution subject to the conditions of the visa. Admission to an "
        "institution and immigration authorisation are separate — acceptance by a school or "
        "university does not guarantee visa approval.",
    ),
    (
        "study",
        "Can I work while studying in South Africa?",
        "Any work while on a study visa is subject to the conditions endorsed on your visa "
        "and applicable law. Do not assume that study status automatically permits full-time "
        "employment. Check your conditions carefully before accepting work.",
    ),
    (
        "study",
        "What documents are needed for a study visa?",
        "Typical requirements involve proof of acceptance by an eligible institution, a valid "
        "passport, financial evidence, medical cover where required, and other items on the "
        "current official checklist. Exact documents depend on the institution and "
        "immigration requirements in force. We align your file to the live checklist.",
    ),
    (
        "study",
        "Can my family accompany me while I study?",
        "Family members may need their own appropriate immigration status (for example as "
        "dependents where the category allows). Eligibility depends on relationship, age and "
        "current rules. Each application is assessed separately and approval is not "
        "guaranteed.",
    ),
    # --- FAMILY ---
    (
        "family",
        "Can I apply for a South African spouse visa?",
        "Spouse or life-partner categories exist under South African immigration law for "
        "qualifying relationships, subject to evidence and statutory requirements. Eligibility "
        "depends on the genuine nature of the relationship and the documents required at the "
        "time of application. Mzansi assists with preparation; DHA decides the outcome.",
    ),
    (
        "family",
        "Can I apply for a relative visa?",
        "Relative or family-based temporary residence categories have specific legal "
        "requirements regarding the relationship, dependency and supporting evidence. Not "
        "every family connection qualifies. A consultation clarifies whether a relative "
        "pathway may apply to your facts under current rules.",
    ),
    (
        "family",
        "Can my children obtain immigration status through me?",
        "Children may qualify for dependent or other family-linked status depending on age, "
        "relationship, custody arrangements and the principal applicant’s category. "
        "Requirements differ for minors and adult children. Each child’s application is "
        "assessed on its own merits; approval is never automatic.",
    ),
    (
        "family",
        "What proof of relationship may be required?",
        "Authorities commonly request civil-status documents such as marriage certificates, "
        "birth certificates, proof of cohabitation or other evidence of a genuine "
        "relationship, depending on the category. Documents issued abroad may need "
        "translation or authentication. Exact proof follows the official checklist for your "
        "matter.",
    ),
    # --- BUSINESS ---
    (
        "business",
        "Can foreigners establish or operate businesses in South Africa?",
        "Foreign nationals may establish or invest in businesses subject to company, tax and "
        "other commercial laws — and separately subject to holding the correct immigration "
        "authorisation for their activities. Business registration alone does not replace a "
        "visa or permit. Treat immigration status and business compliance as linked but "
        "distinct workstreams.",
    ),
    (
        "business",
        "What is a South African business visa?",
        "A business visa or related temporary residence category is generally aimed at "
        "foreign nationals who invest in or operate a qualifying business in South Africa "
        "under published criteria. Capital, business plans and other evidence requirements "
        "apply and can change. Approval remains a government decision.",
    ),
    (
        "business",
        "Can I employ people through a business immigration route?",
        "Operating a business and employing staff engages both immigration conditions and "
        "South African labour and tax obligations. Your own immigration status does not "
        "automatically authorise every hiring decision. Plan immigration and employment "
        "compliance together; we can coordinate immigration guidance while you obtain "
        "separate labour advice where needed.",
    ),
    # --- DOCUMENTS ---
    (
        "documents",
        "What documents do I need for my application?",
        "Requirements depend on the application type, your nationality and personal history. "
        "Most matters need a valid passport and category-specific evidence; many also need "
        "police clearances, financial proof or civil-status documents. There is no single "
        "universal list. After you instruct us, we maintain a live checklist on your "
        "application aligned to current official requirements.",
    ),
    (
        "documents",
        "Can I upload my documents through the client portal?",
        "Yes. Once your client account is activated, you can upload requested documents "
        "securely through the client portal. Using the portal is preferred over sending "
        "sensitive files by unsecured email.",
    ),
    (
        "documents",
        "What happens if one of my documents is rejected?",
        "If a document is rejected during our review or flagged as unsuitable, you will "
        "receive a reason and may be asked to upload a replacement. Government authorities "
        "may also refuse documents at lodging or decision stage. A Mzansi review reduces "
        "avoidable issues but cannot guarantee official acceptance.",
    ),
    (
        "documents",
        "Can I replace a document after uploading it?",
        "Yes, where the application workflow permits it. You can usually upload a revised "
        "file against the checklist item. Speak to your consultant before replacing a "
        "document that has already been lodged with the authorities.",
    ),
    (
        "documents",
        "Are my documents secure?",
        "Immigration documents in the Mzansi portal are treated as private. Access is "
        "limited to authorised systems and staff working on your matter. We apply reasonable "
        "security controls; no online system is perfectly risk-free. Prefer portal upload "
        "over public email attachments.",
    ),
    (
        "documents",
        "What happens if I do not provide a requested document?",
        "Missing documents can delay preparation, prevent lodging, or lead to refusal by the "
        "authorities depending on the matter. If you cannot obtain an item, tell your "
        "consultant promptly so alternatives or timing can be considered. We cannot lodge a "
        "complete file without the required evidence.",
    ),
    # --- TRACKING ---
    (
        "tracking",
        "Can I track my application online?",
        "Yes, where tracking information is available. Inside the Mzansi portal you can see "
        "your internal case stage, and where authorised you can access external VFS/DHA "
        "tracking information or a secure link to the official tracker.",
    ),
    (
        "tracking",
        "Can I track my VFS/DHA application through the Mzansi portal?",
        "Where an authorised integration is available, the portal can display external status "
        "information. Otherwise we provide a secure link to the official tracking service. "
        "VFS provides application tracking for South Africa DHA services; Mzansi status and "
        "VFS/DHA status are not the same thing.",
    ),
    (
        "tracking",
        "Does VFS make the final visa decision?",
        "No. VFS Global supports application submission and related facilitation services. "
        "DHA staff process and decide visa applications. VFS does not decide visas and does "
        "not influence the outcome. Mzansi likewise cannot decide or alter government "
        "outcomes.",
    ),
    (
        "tracking",
        "Why has my application status not changed?",
        "External processing often takes time, and status text may lag behind actual work in "
        "progress. Updates depend on the relevant authority or VFS system. A static status "
        "does not always mean nothing is happening. We can help you interpret known stages "
        "but cannot force an update on government systems.",
    ),
    (
        "tracking",
        "Can Mzansi change my VFS/DHA application status?",
        "No. Mzansi may update its own internal case-management status, but it cannot alter "
        "government or VFS records. Only the relevant authority’s systems reflect the "
        "official status of a lodged application.",
    ),
    # --- CONSULTATIONS ---
    (
        "consultations",
        "Do I need an account to book a consultation?",
        "No. Guests can book a consultation on the website without logging in. After you "
        "book, we create a client account for you and send an activation email so you can "
        "access the portal.",
    ),
    (
        "consultations",
        "What information do I need to book?",
        "You will typically need your name, surname, email address, cell phone number, the "
        "consultation type, and your preferred date and time. You must also accept the Terms "
        "& Conditions and Privacy Policy before confirming.",
    ),
    (
        "consultations",
        "What happens after I book?",
        "You receive an automatic confirmation for the consultation. A client account is "
        "created (if you do not already have one) and an activation email is sent so you can "
        "set your password and use the portal. Check your spam folder if the email does not "
        "arrive promptly.",
    ),
    (
        "consultations",
        "What if my preferred time is already booked?",
        "The booking system will show that the slot is unavailable and recommend the nearest "
        "available alternatives. You can also join a waitlist where that feature is offered "
        "for a full slot.",
    ),
    (
        "consultations",
        "Can I reschedule my consultation?",
        "Yes, subject to the consultation’s rescheduling policy (notice period and any fee "
        "rules shown at booking or in your confirmation). Use the portal or contact us as "
        "early as possible if you need to move the appointment.",
    ),
    (
        "consultations",
        "Can I cancel my consultation?",
        "Yes, subject to the cancellation and refund policy published for that consultation "
        "type. Late cancellations or no-shows may forfeit fees according to that policy.",
    ),
    (
        "consultations",
        "Will I receive a reminder?",
        "Yes. Reminders are sent according to the configured reminder schedule (for example "
        "by email) so you can prepare documents and join on time.",
    ),
    # --- PORTAL ---
    (
        "portal",
        "What can I do in the client portal?",
        "Depending on your matter, the client portal lets you view applications, upload and "
        "manage documents, message your consultant, manage consultations, receive "
        "notifications, and access application tracking information or official tracking "
        "links. Creating an account alone does not open an immigration application — that "
        "happens when you instruct us on a service.",
    ),
    (
        "portal",
        "How do I activate my client account?",
        "After booking (or when an account is created for you), you receive a secure "
        "activation email with a link to create your password. Open the link and follow the "
        "prompts. Activation links typically expire within 72 hours for security.",
    ),
    (
        "portal",
        "What if my activation link expires?",
        "Activation links expire after 72 hours. If yours has expired, request a new "
        "activation link from the login or activation page using the email address on your "
        "booking. Contact support if you still cannot activate.",
    ),
    (
        "portal",
        "How do I reset my password?",
        "Use the “Forgot password” option on the login page. You will receive a secure "
        "password-reset email. Choose a strong unique password and do not share it. If you "
        "do not receive the email, check spam or contact support.",
    ),
    (
        "portal",
        "Can I access my documents from my phone?",
        "Yes. The client portal is mobile-friendly, and where the Mzansi mobile application "
        "is available you can access your matter from your phone. Use a secure network when "
        "uploading sensitive documents.",
    ),
    (
        "portal",
        "Can I communicate with my immigration consultant online?",
        "Yes. Secure messaging in the client portal keeps conversation attached to your case "
        "so details are not scattered across personal email. Response times follow our "
        "business-hours service standards and do not reflect government processing times.",
    ),
    # --- FEES ---
    (
        "fees",
        "How much does an immigration consultation cost?",
        "Consultation prices are set per consultation type and are shown dynamically on the "
        "booking page at the time you select a slot. Amounts can change; always rely on the "
        "price displayed during booking rather than older quotes or articles.",
    ),
    (
        "fees",
        "Are government fees included in your professional fees?",
        "No, not by default. Mzansi professional fees cover our preparation and case work. "
        "Government fees payable to the Department of Home Affairs (or another authority) "
        "are separate unless a written quotation expressly states that they are bundled.",
    ),
    (
        "fees",
        "Are VFS fees included?",
        "Applicable VFS or visa-facilitation charges are generally separate from Mzansi "
        "professional fees. Your quotation or invoice will distinguish our fees from "
        "third-party facilitation charges where both apply.",
    ),
    (
        "fees",
        "Are professional fees refundable?",
        "Refunds follow the published refund policy for the service and payment in question. "
        "As a rule, fees for work already performed are typically non-refundable, and a "
        "government refusal does not by itself create a right to a refund of professional "
        "fees. See the Terms and your engagement note for details.",
    ),
    (
        "fees",
        "Do I pay before my application starts?",
        "Payment timing depends on the service. Consultations are usually paid at booking. "
        "Full application assistance is typically confirmed with a quotation and payment "
        "terms before substantive preparation begins. Government and VFS fees are paid "
        "according to the official or facilitation process for your lodging channel.",
    ),
]
