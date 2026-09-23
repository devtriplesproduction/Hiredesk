
import { val, esc, icon, badge, page, INK } from './document-utils';

const LOGO_WHITE = '<!--LOGO-->';

export function buildPage1(d: any) {
      return '<div class="page cover">' +
        '<img class="wm" src="' + LOGO_WHITE + '">' +
        '<div class="innerc">' +
        '<div class="logo-row"><img src="' + LOGO_WHITE + '"><div class="word">TRIPLE S PRODUCTION<span class="subw">CREATIVE &amp; TECHNOLOGY AGENCY</span></div></div>' +
        '<div class="mid"><div class="title">Letter of<br>Appointment</div><div class="rule-w"></div>' +
        '<div class="tagline"><b>Creative</b> &nbsp;&middot;&nbsp; <b>Technology</b> &nbsp;&middot;&nbsp; <b>Branding</b></div></div>' +
        '<div class="bottom"><div class="metarow">' +
        '<div class="m"><div class="lbl">Prepared For</div><div class="val">' + val(d.candidateName) + '</div></div>' +
        '<div class="m"><div class="lbl">Reference No.</div><div class="val">' + esc(d.refNo) + '</div></div>' +
        '<div class="m"><div class="lbl">Date of Joining</div><div class="val">' + val(d.dateOfJoining) + '</div></div>' +
        '</div><div class="confbar"><div>Strictly Private &amp; Confidential</div><div>' + val(d.letterDate) + '</div></div></div>' +
        '</div></div>';
    }

    export function buildPage2(d: any) {
      const inner =
        '<h1 class="pt">Welcome to the Team</h1>' +
        '<p class="body">Dear ' + val(d.candidateName) + ',</p>' +
        '<p class="body">With reference to your application and interview with us, we are pleased to offer you employment with Triple S Production (&ldquo;the Company&rdquo;), on the terms set out in this letter and its Annexures. This letter summarises the key terms of your appointment &mdash; a detailed Employment Agreement will be shared for signature on or before your date of joining.</p>' +
        '<div class="strip">' +
        '<div class="cell"><div class="lbl">Employment Type</div><div class="val">Full-Time</div></div>' +
        '<div class="cell"><div class="lbl">Location</div><div class="val">' + val(d.officeLocation) + '</div></div>' +
        '<div class="cell"><div class="lbl">Department</div><div class="val">' + val(d.department) + '</div></div>' +
        '<div class="cell"><div class="lbl">Working Hours</div><div class="val">' + val(d.workingHours) + '</div></div>' +
        '</div>' +
        '<div class="infocard2"><div class="hd2">' + icon("user", 16, "#ffffff") + ' Candidate Information</div><div class="rows">' +
        '<div class="row2">' + badge("briefcase", 30, false, "#F5F5F5") + '<div><div class="lbl">Designation</div><div class="val">' + val(d.designation) + '</div></div></div>' +
        '<div class="row2">' + badge("users", 30, false, "#F5F5F5") + '<div><div class="lbl">Reporting To</div><div class="val">' + val(d.reportingManager) + '</div></div></div>' +
        '<div class="row2">' + badge("calendar", 30, false, "#F5F5F5") + '<div><div class="lbl">Date of Joining</div><div class="val">' + val(d.dateOfJoining) + '</div></div></div>' +
        '<div class="row2">' + badge("hourglass", 30, false, "#F5F5F5") + '<div><div class="lbl">Probation Period</div><div class="val">' + val(d.probationPeriod) + '</div></div></div>' +
        '<div class="row2">' + badge("pin", 30, false, "#F5F5F5") + '<div><div class="lbl">Place of Work</div><div class="val">' + val(d.officeLocation) + '</div></div></div>' +
        '<div class="row2">' + badge("bell", 30, false, "#F5F5F5") + '<div><div class="lbl">Notice Period (Post-Confirmation)</div><div class="val">' + esc(d.noticePeriod) + '</div></div></div>' +
        '</div></div>' +
        '<div class="banner">' + badge("shield", 32) + '<div>This appointment is subject to successful verification of your documents, educational qualifications, and professional references. Any discrepancy discovered at any stage may result in withdrawal of this offer.</div></div>' +
        '<div class="sig2"><div><div class="name">' + val(d.proprietorName) + '</div><div class="role">Founder, Triple S Production</div></div>' +
        '<div style="text-align:right;"><div class="role">Signed &amp; issued on</div><div class="name">' + val(d.letterDate) + '</div></div></div>';
      return page(inner, 2, d);
    }

    export function buildPage3(d: any) {
      const items = [
        ["compass", "First Increment", "Reviewed at 3 months, on successful confirmation of employment."],
        ["clipboard", "Performance Bonus", "Linked to annual performance appraisal and Company results."],
        ["compass", "Paid Upskilling", "Company-sponsored courses and certifications to support your growth."],
        ["bell", "Notice Period", esc(d.noticePeriod) + "'s notice is required from either side, post confirmation of employment."],
        ["clipboard", "Leave &amp; Credit Policy", "8 active working hours/day is the standard. Time worked beyond this is banked as credit; every 8 credits earned equals 1 day of paid leave. No other paid leaves apply. Full details in Annexure &mdash; Leave &amp; Attendance Policy."]
      ];
      const rows = items.map(function (it) {
        return '<div class="row2f">' + badge(it[0], 32, false, "#F5F5F5") + '<div><div class="h">' + it[1] + '</div><div class="d">' + it[2] + '</div></div></div>';
      }).join("");
      const inner =
        '<h1 class="pt">Compensation &amp; Benefits</h1>' +
        '<p class="body">Your compensation is structured in two stages &mdash; a fixed monthly salary during your ' + esc(d.probationPeriod) + ' probation period, followed by your full Cost to Company (CTC) on successful confirmation.</p>' +
        '<div class="payflow">' +
        '<div class="panel"><div class="kicker2">Probation &middot; ' + esc(d.probationPeriod) + '</div><div class="amt">&#8377;' + val(d.probationSalary) + '</div><div class="sub2">Fixed monthly salary during the testing phase</div></div>' +
        '<div class="arrow">' + icon("chevron-down", 22, "#6B6B6B") + '</div>' +
        '<div class="panel dark"><div class="kicker2">Post-Confirmation</div><div class="amt">&#8377;' + val(d.ctcAmount) + ' <span style="font-size:10pt;font-weight:500;">/ yr</span></div><div class="sub2">&#8377;' + val(d.monthlyGross) + ' monthly gross &middot; details in Annexure B</div></div>' +
        '</div>' +
        '<div class="banner" style="margin-top:6mm;">' + badge("shield", 32) + '<div>The probation salary is a fixed, testing-phase compensation. Your full CTC, increments, and benefits apply only after successful confirmation at the end of the probation period.</div></div>' +
        '<div class="paycard">' + rows + '</div>';
      return page(inner, 3, d);
    }

    export function buildPage4(d: any) {
      const items = [
        ["document-check", "Employment Agreement", "A detailed agreement covering role, term, and conditions will be signed on or before joining."],
        ["lock", "Confidentiality &amp; Data Security", "You agree to protect all confidential business, client, and technical information, and to use Company systems and data per security policy."],
        ["users", "Code of Conduct", "Professional conduct, workplace behaviour, and disciplinary standards apply."],
        ["search", "Background Verification", "This offer is contingent on satisfactory document and reference checks."],
        ["bell", "Notice Period", esc(d.noticePeriod) + " notice is required from either side, post confirmation of employment."],
        ["clock", "Office Timing &amp; Leave Credits", esc(d.workingHours) + ". 8 active working hours/day is standard; extra hours are banked as credit, and 8 credits earned equal 1 day of paid leave. No other paid leaves apply."],
        ["calendar", "Leave Approval &amp; Discipline", "Medical and consecutive leaves require prior approval. Unpaid leave without prior notice may lead to strict disciplinary action, including termination in serious cases."],
        ["shield", "Loss or Damage", "Any loss or damage caused to Company property or assets due to the employee's action or negligence will result in a deduction from salary."],
        ["badge-check", "Acceptance Validity", "This offer is valid for signature until " + val(d.offerValidityDate) + "."],
        ["scale", "Intellectual Property", "All work product created during employment belongs to the Company or its clients."]
      ];
      const cards = items.map(function (it) {
        return '<div class="lcard">' + badge(it[0], 36, true) + '<div><div class="h">' + it[1] + '</div><div class="d">' + it[2] + '</div></div></div>';
      }).join("");
      const inner =
        '<h1 class="pt">Key Terms &amp; Conditions</h1>' +
        '<p class="body">The points below summarise the legal and policy framework governing your employment. Full clauses are set out in the Employment Agreement and referenced Company policies.</p>' +
        '<div class="lgrid">' + cards + '</div>' +
        '<div class="banner">' + badge("scale", 32) + '<div>This page is a plain-language summary for your convenience. The binding legal terms are set out in full in the Employment Agreement and the Company policies referenced above.</div></div>';
      return page(inner, 4, d);
    }

    export function buildPage5(d: any) {
      const values = [
        ["badge-check", "Ownership", "We take responsibility and deliver with accountability."],
        ["party", "Creativity", "We think originally and create work with real impact."],
        ["shield", "Integrity", "We are honest and transparent in everything we do."],
        ["compass", "Continuous Learning", "We grow, adapt, and stay ahead of the curve."],
        ["users", "Team First", "We collaborate closely and win together."],
        ["badge-check", "Excellence", "We pursue the highest standards in our work."]
      ];
      const vcards = values.map(function (v) {
        return '<div class="valcard5b">' + badge(v[0], 32) + '<div class="h">' + v[1] + '</div><div class="d">' + v[2] + '</div></div>';
      }).join("");
      const inner =
        '<h1 class="pt">Our Culture</h1>' +
        '<p class="body">A small, hands-on team that moves fast, owns outcomes, and takes pride in craft &mdash; on every project, every time.</p>' +
        '<div class="mvrow">' +
        '<div class="mvblock">' + badge("compass", 36) + '<div class="h">Mission</div><div class="d">To help ambitious brands and businesses grow through thoughtful creative, technology, and marketing work.</div></div>' +
        '<div class="mvblock">' + badge("eye", 36) + '<div class="h">Vision</div><div class="d">To be Maharashtra&rsquo;s most trusted creative &amp; technology partner for growing businesses.</div></div>' +
        '<div class="mvblock">' + badge("heart", 36) + '<div class="h">Culture</div><div class="d">A close-knit team that values ownership, craft, and honest feedback over hierarchy.</div></div>' +
        '</div>' +
        '<div class="valuesgrid5b">' + vcards + '</div>' +
        '<div class="benefitstrip" style="margin-top:6mm;">' +
        '<div class="benefitchip">' + badge("hourglass", 28, false, "#F5F5F5") + '<div><div class="h">Leave Credit System</div><div class="d">Extra hours convert to paid leave</div></div></div>' +
        '<div class="benefitchip">' + badge("compass", 28, false, "#F5F5F5") + '<div><div class="h">Learning Support</div><div class="d">Paid upskilling courses</div></div></div>' +
        '<div class="benefitchip">' + badge("party", 28, false, "#F5F5F5") + '<div><div class="h">Team Celebrations</div><div class="d">Festivals &amp; milestones</div></div></div>' +
        '</div>' +
        '<div class="quote5">' + icon("quote", 30, "#ffffff") + '<div><div class="qt">&ldquo;We don&rsquo;t just build brands &mdash; we build lasting impact.&rdquo;</div><div class="qa">&mdash; ' + val(d.proprietorName) + ', Founder</div></div></div>';
      return page(inner, 5, d);
    }

    export function buildPage6(d: any) {
      const steps = [
        ["pencil", "Offer Accepted", "You sign and return this letter to confirm your acceptance."],
        ["document-check", "Documents Submitted", "You share the documents required for verification, listed in Annexure C."],
        ["search", "HR Verification", "We complete background, reference, and document verification."],
        ["mail", "Email &amp; Account Creation", "Your official email and system accounts are created and shared."],
        ["laptop", "Equipment Setup", "Your workstation, tools, and access credentials are prepared."],
        ["calendar", "Joining Day", "You report on your date of joining and complete formalities with HR."],
        ["party", "Welcome Session", "A short onboarding session to introduce the team, tools, and ways of working."]
      ];
      const rows = steps.map(function (s) {
        return '<div class="rstep"><div class="col"><div class="badge" style="width:32px;height:32px;background:' + INK + ';color:#fff;">' + icon(s[0], 15, "#ffffff") + '</div><div class="connector"></div></div>' +
          '<div class="box"><div><div class="h">' + s[1] + '</div><div class="d">' + s[2] + '</div></div></div></div>';
      }).join("");
      const inner =
        '<h1 class="pt">Onboarding Roadmap</h1>' +
        '<p class="body">Here is what to expect between accepting this offer and your first day at Triple S Production.</p>' +
        '<div class="roadmap">' + rows + '</div>';
      return page(inner, 6, d);
    }

    export function buildPage7(d: any) {
      const notes = [
        "All information shared by you will be kept strictly confidential by the Company.",
        "This offer is valid for acceptance until the date specified on the cover page.",
        "Compensation and designation are subject to change only by mutual written agreement.",
        "The Company reserves the right to amend policies in line with applicable law.",
        "Any relocation, transfer, or change in reporting structure will be communicated in writing in advance."
      ];
      const resp = [
        "Devote full working time and attention to the business of the Company.",
        "Do not engage in other employment, business, or freelance work without written consent.",
        "Protect confidential information, client data, and Company intellectual property.",
        "Comply with the Code of Conduct and IT Policy at all times.",
        "Report any conflict of interest or workplace concern promptly to HR or your manager."
      ];
      const notesHtml = notes.map(function (n) { return '<div class="p7item"><div class="dot"></div><div>' + n + '</div></div>'; }).join("");
      const respHtml = resp.map(function (n) { return '<div class="p7item"><div class="dot"></div><div>' + n + '</div></div>'; }).join("");
      const inner =
        '<h1 class="pt">Notes &amp; Responsibilities</h1>' +
        '<div class="p7wrap">' +
        '<div class="p7col"><h3>' + icon("file", 18) + ' Important Notes</h3><div class="p7list">' + notesHtml + '</div></div>' +
        '<div class="p7col"><h3>' + icon("badge-check", 18) + ' Employee Responsibilities</h3><div class="p7list">' + respHtml + '</div></div>' +
        '</div>' +
        '<div class="polstrip">' +
        '<div class="polchip">' + badge("file", 26, false, "#F5F5F5") + '<div><div class="h">Employee Handbook</div><div class="d">Conduct &amp; leave policy</div></div></div>' +
        '<div class="polchip">' + badge("clock", 26, false, "#F5F5F5") + '<div><div class="h">Attendance Policy</div><div class="d">Office timing &amp; leave credits</div></div></div>' +
        '<div class="polchip">' + badge("cpu", 26, false, "#F5F5F5") + '<div><div class="h">IT &amp; Security</div><div class="d">Data &amp; device use</div></div></div>' +
        '</div>' +
        '<div class="helpcard">' +
        '<div class="cols"><div class="h">Need Help? We&rsquo;re One Message Away</div>' +
        '<div class="row7">' + icon("mail", 16, "#ffffff") + ' ' + esc(d.hrEmail) + '</div>' +
        '<div class="row7">' + icon("phone", 16, "#ffffff") + ' ' + val(d.hrPhone) + '</div>' +
        '<div class="row7">' + icon("globe", 16, "#ffffff") + ' ' + esc(d.website) + '</div>' +
        '<div class="row7">' + icon("pin", 16, "#ffffff") + ' ' + esc(d.officeAddress) + '</div>' +
        '<div class="row7">' + icon("siren", 16, "#ffffff") + ' Emergency: ' + val(d.emergencyContact) + '</div></div>' +
        '</div>';
      return page(inner, 7, d);
    }

    export function buildPage8(d: any) {
      const inner =
        '<h1 class="pt">Acceptance of Offer</h1>' +
        '<div class="statement">I, ' + val(d.candidateName) + ', confirm that I have read, understood, and voluntarily accept the terms of this Letter of Appointment and its Annexures, issued by Triple S Production. I understand that a detailed Employment Agreement will be executed separately on or before my date of joining.</div>' +
        '<div class="sigwrap">' +
        '<div class="sigbox"><div class="lbl">For Triple S Production</div><div class="line"></div><div><div class="name">' + val(d.proprietorName) + '</div><div class="date">Founder &nbsp;&middot;&nbsp; Date: ______________</div></div></div>' +
        '<div class="sigbox"><div class="lbl">Employee Signature</div><div class="line"></div><div><div class="name">' + val(d.candidateName) + '</div><div class="date">Date: ______________</div></div></div>' +
        '</div>' +
        '<div class="stamprow">' +
        '<div class="stampbox">' + icon("users", 26, "#bbbbbb") + '<div class="lbl">Witness</div></div>' +
        '<div class="stampbox">' + icon("stamp", 26, "#bbbbbb") + '<div class="lbl">Company Stamp</div></div>' +
        '</div>' +
        '<div class="welcome8"><img class="wm8" src="' + LOGO_WHITE + '"><div class="h">Welcome to Triple S Production</div><div class="d">Let&rsquo;s build something extraordinary, together.</div></div>';
      return page(inner, 8, d);
    }

    // ============== INTERNSHIP OFFER (8-page kit) ==============
    export function buildIntern1(d: any) {
      return '<div class="page cover">' +
        '<img class="wm" src="' + LOGO_WHITE + '">' +
        '<div class="innerc">' +
        '<div class="logo-row"><img src="' + LOGO_WHITE + '"><div class="word">TRIPLE S PRODUCTION<span class="subw">CREATIVE &amp; TECHNOLOGY AGENCY</span></div></div>' +
        '<div class="mid"><div class="title">Letter of<br>Internship</div><div class="rule-w"></div>' +
        '<div class="tagline"><b>Creative</b> &nbsp;&middot;&nbsp; <b>Technology</b> &nbsp;&middot;&nbsp; <b>Branding</b></div></div>' +
        '<div class="bottom"><div class="metarow">' +
        '<div class="m"><div class="lbl">Prepared For</div><div class="val">' + val(d.candidateName) + '</div></div>' +
        '<div class="m"><div class="lbl">Reference No.</div><div class="val">' + esc(d.refNo) + '</div></div>' +
        '<div class="m"><div class="lbl">Date of Joining</div><div class="val">' + val(d.dateOfJoining) + '</div></div>' +
        '</div><div class="confbar"><div>Strictly Private &amp; Confidential</div><div>' + val(d.letterDate) + '</div></div></div>' +
        '</div></div>';
    }
    export function buildIntern2(d: any) {
      const inner =
        '<h1 class="pt">Welcome to the Team</h1>' +
        '<p class="body">Dear ' + val(d.candidateName) + ',</p>' +
        '<p class="body">With reference to your application and interview with us, we are pleased to offer you an internship with Triple S Production (&ldquo;the Company&rdquo;), on the terms set out in this letter and its Annexures. This letter summarises the key terms of your internship &mdash; a detailed Internship Agreement will be shared for signature on or before your date of joining.</p>' +
        '<div class="strip">' +
        '<div class="cell"><div class="lbl">Engagement Type</div><div class="val">Internship</div></div>' +
        '<div class="cell"><div class="lbl">Location</div><div class="val">' + val(d.officeLocation) + '</div></div>' +
        '<div class="cell"><div class="lbl">Department</div><div class="val">' + val(d.department) + '</div></div>' +
        '<div class="cell"><div class="lbl">Working Hours</div><div class="val">' + val(d.workingHours) + '</div></div>' +
        '</div>' +
        '<div class="infocard2"><div class="hd2">' + icon("user", 16, "#ffffff") + ' Intern Information</div><div class="rows">' +
        '<div class="row2">' + badge("briefcase", 30, false, "#F5F5F5") + '<div><div class="lbl">Designation</div><div class="val">' + val(d.designation) + '</div></div></div>' +
        '<div class="row2">' + badge("users", 30, false, "#F5F5F5") + '<div><div class="lbl">Reporting To</div><div class="val">' + val(d.reportingManager) + '</div></div></div>' +
        '<div class="row2">' + badge("calendar", 30, false, "#F5F5F5") + '<div><div class="lbl">Date of Joining</div><div class="val">' + val(d.dateOfJoining) + '</div></div></div>' +
        '<div class="row2">' + badge("hourglass", 30, false, "#F5F5F5") + '<div><div class="lbl">Internship Duration</div><div class="val">' + val(d.probationPeriod) + ' (until ' + val(d.internshipEndDate) + ')</div></div></div>' +
        '<div class="row2">' + badge("pin", 30, false, "#F5F5F5") + '<div><div class="lbl">Place of Work</div><div class="val">' + val(d.officeLocation) + '</div></div></div>' +
        '<div class="row2">' + badge("bell", 30, false, "#F5F5F5") + '<div><div class="lbl">Notice Period</div><div class="val">' + esc(d.noticePeriod) + '</div></div></div>' +
        '</div></div>' +
        '<div class="banner">' + badge("shield", 32) + '<div>This internship is subject to successful verification of your documents, educational qualifications, and professional references. Any discrepancy discovered at any stage may result in withdrawal of this offer.</div></div>' +
        '<div class="sig2"><div><div class="name">' + val(d.proprietorName) + '</div><div class="role">Founder, Triple S Production</div></div>' +
        '<div style="text-align:right;"><div class="role">Signed &amp; issued on</div><div class="name">' + val(d.letterDate) + '</div></div></div>';
      return page(inner, 2, d, "Letter of Internship");
    }
    export function buildIntern3(d: any) {
      const stipendLabel = /unpaid/i.test(String(d.probationSalary || "")) ? "Unpaid" : ("&#8377;" + val(d.probationSalary));
      const items = [
        ["document-check", "Certificate of Completion", "Issued at the end of the internship, subject to satisfactory performance and completion of assigned work."],
        ["clipboard", "Letter of Recommendation", "May be issued on request, based on your performance and conduct during the internship."],
        ["bell", "Notice Period", esc(d.noticePeriod) + "'s notice is required from either side to discontinue the internship."],
        ["clipboard", "Leave &amp; Credit Policy", "8 active working hours/day is the standard. Time worked beyond this is banked as credit; every 8 credits earned equals 1 day of paid leave. No other paid leaves apply. Full details in Annexure &mdash; Leave &amp; Attendance Policy."]
      ];
      const rows = items.map(function (it) {
        return '<div class="row2f">' + badge(it[0], 32, false, "#F5F5F5") + '<div><div class="h">' + it[1] + '</div><div class="d">' + it[2] + '</div></div></div>';
      }).join("");
      const inner =
        '<h1 class="pt">Stipend &amp; Terms</h1>' +
        '<p class="body">Your engagement with the Company is for a fixed internship duration of ' + esc(d.probationPeriod) + ', on the stipend structure set out below.</p>' +
        '<div class="payflow">' +
        '<div class="panel dark" style="flex:1;"><div class="kicker2">Monthly Stipend</div><div class="amt">' + stipendLabel + '</div><div class="sub2">For the duration of the internship (' + esc(d.probationPeriod) + ')</div></div>' +
        '</div>' +
        '<div class="banner" style="margin-top:6mm;">' + badge("shield", 32) + '<div>Continuation as a full-time employee (PPO) is not guaranteed. It will only be considered after successful completion of at least the first 3 months of the internship, based on your performance, at the Company\u2019s sole discretion.</div></div>' +
        '<div class="paycard">' + rows + '</div>';
      return page(inner, 3, d, "Letter of Internship");
    }
    export function buildIntern4(d: any) {
      const items = [
        ["document-check", "Internship Agreement", "A detailed agreement covering role, duration, and conditions will be signed on or before joining."],
        ["lock", "Confidentiality &amp; Data Security", "You agree to protect all confidential business, client, and technical information, and to use Company systems and data per security policy."],
        ["users", "Code of Conduct", "Professional conduct, workplace behaviour, and disciplinary standards apply."],
        ["search", "Background Verification", "This offer is contingent on satisfactory document and reference checks."],
        ["bell", "Notice Period", esc(d.noticePeriod) + " notice is required from either side to discontinue the internship."],
        ["clock", "Office Timing &amp; Leave Credits", esc(d.workingHours) + ". 8 active working hours/day is standard; extra hours are banked as credit, and 8 credits earned equal 1 day of paid leave. No other paid leaves apply."],
        ["calendar", "Leave Approval &amp; Discipline", "Medical and consecutive leaves require prior approval. Unpaid leave without prior notice may lead to strict disciplinary action, including termination in serious cases."],
        ["shield", "Loss or Damage", "Any loss or damage caused to Company property or assets due to the intern's action or negligence will result in a deduction from stipend, where applicable."],
        ["badge-check", "No Guaranteed PPO", "Conversion to a full-time role is not guaranteed and is considered only after successful completion of at least 3 months, at the Company's sole discretion."],
        ["scale", "Intellectual Property", "All work product created during the internship belongs to the Company or its clients."]
      ];
      const cards = items.map(function (it) {
        return '<div class="lcard">' + badge(it[0], 36) + '<div><div class="h">' + it[1] + '</div><div class="d">' + it[2] + '</div></div></div>';
      }).join("");
      const inner =
        '<h1 class="pt">Key Terms &amp; Conditions</h1>' +
        '<p class="body">The points below summarise the legal and policy framework governing your internship. Full clauses are set out in the Internship Agreement and referenced Company policies.</p>' +
        '<div class="lgrid">' + cards + '</div>' +
        '<div class="banner">' + badge("scale", 32) + '<div>This page is a plain-language summary for your convenience. The binding legal terms are set out in full in the Internship Agreement and the Company policies referenced above.</div></div>';
      return page(inner, 4, d, "Letter of Internship");
    }
    export function buildIntern5(d: any) {
      const values = [
        ["badge-check", "Ownership", "We take responsibility and deliver with accountability."],
        ["party", "Creativity", "We think originally and create work with real impact."],
        ["shield", "Integrity", "We are honest and transparent in everything we do."],
        ["compass", "Continuous Learning", "We grow, adapt, and stay ahead of the curve."],
        ["users", "Team First", "We collaborate closely and win together."],
        ["badge-check", "Excellence", "We pursue the highest standards in our work."]
      ];
      const vcards = values.map(function (v) {
        return '<div class="valcard5b">' + badge(v[0], 32) + '<div class="h">' + v[1] + '</div><div class="d">' + v[2] + '</div></div>';
      }).join("");
      const inner =
        '<h1 class="pt">Our Culture</h1>' +
        '<p class="body">A small, hands-on team that moves fast, owns outcomes, and takes pride in craft &mdash; on every project, every time.</p>' +
        '<div class="mvrow">' +
        '<div class="mvblock">' + badge("compass", 36) + '<div class="h">Mission</div><div class="d">To help ambitious brands and businesses grow through thoughtful creative, technology, and marketing work.</div></div>' +
        '<div class="mvblock">' + badge("eye", 36) + '<div class="h">Vision</div><div class="d">To be Maharashtra&rsquo;s most trusted creative &amp; technology partner for growing businesses.</div></div>' +
        '<div class="mvblock">' + badge("heart", 36) + '<div class="h">Culture</div><div class="d">A close-knit team that values ownership, craft, and honest feedback over hierarchy.</div></div>' +
        '</div>' +
        '<div class="valuesgrid5b">' + vcards + '</div>' +
        '<div class="benefitstrip" style="margin-top:6mm;">' +
        '<div class="benefitchip">' + badge("hourglass", 28, false, "#F5F5F5") + '<div><div class="h">Leave Credit System</div><div class="d">Extra hours convert to paid leave</div></div></div>' +
        '<div class="benefitchip">' + badge("compass", 28, false, "#F5F5F5") + '<div><div class="h">Learning Support</div><div class="d">Paid upskilling courses</div></div></div>' +
        '<div class="benefitchip">' + badge("party", 28, false, "#F5F5F5") + '<div><div class="h">Team Celebrations</div><div class="d">Festivals &amp; milestones</div></div></div>' +
        '</div>' +
        '<div class="quote5">' + icon("quote", 30, "#ffffff") + '<div><div class="qt">&ldquo;We don&rsquo;t just build brands &mdash; we build lasting impact.&rdquo;</div><div class="qa">&mdash; ' + val(d.proprietorName) + ', Founder</div></div></div>';
      return page(inner, 5, d, "Letter of Internship");
    }
    export function buildIntern6(d: any) {
      const steps = [
        ["pencil", "Offer Accepted", "You sign and return this letter to confirm your acceptance."],
        ["document-check", "Documents Submitted", "You share the documents required for verification, listed in Annexure C."],
        ["search", "HR Verification", "We complete background, reference, and document verification."],
        ["mail", "Email &amp; Account Creation", "Your official email and system accounts are created and shared."],
        ["laptop", "Equipment Setup", "Your workstation, tools, and access credentials are prepared."],
        ["calendar", "Joining Day", "You report on your date of joining and complete formalities with HR."],
        ["party", "Welcome Session", "A short onboarding session to introduce the team, tools, and ways of working."]
      ];
      const rows = steps.map(function (s) {
        return '<div class="rstep"><div class="col"><div class="badge" style="width:32px;height:32px;background:' + INK + ';color:#fff;">' + icon(s[0], 15, "#ffffff") + '</div><div class="connector"></div></div>' +
          '<div class="box"><div><div class="h">' + s[1] + '</div><div class="d">' + s[2] + '</div></div></div></div>';
      }).join("");
      const inner =
        '<h1 class="pt">Onboarding Roadmap</h1>' +
        '<p class="body">Here is what to expect between accepting this offer and your first day at Triple S Production.</p>' +
        '<div class="roadmap">' + rows + '</div>';
      return page(inner, 6, d, "Letter of Internship");
    }
    export function buildIntern7(d: any) {
      const notes = [
        "All information shared by you will be kept strictly confidential by the Company.",
        "This offer is valid for acceptance until the date specified on the cover page.",
        "Compensation and designation are subject to change only by mutual written agreement.",
        "The Company reserves the right to amend policies in line with applicable law.",
        "Any relocation, transfer, or change in reporting structure will be communicated in writing in advance."
      ];
      const resp = [
        "Devote full working time and attention to the assigned work during the internship.",
        "Do not engage in other employment, business, or freelance work without written consent.",
        "Protect confidential information, client data, and Company intellectual property.",
        "Comply with the Code of Conduct and IT Policy at all times.",
        "Report any conflict of interest or workplace concern promptly to HR or your manager."
      ];
      const notesHtml = notes.map(function (n) { return '<div class="p7item"><div class="dot"></div><div>' + n + '</div></div>'; }).join("");
      const respHtml = resp.map(function (n) { return '<div class="p7item"><div class="dot"></div><div>' + n + '</div></div>'; }).join("");
      const inner =
        '<h1 class="pt">Notes &amp; Responsibilities</h1>' +
        '<div class="p7wrap">' +
        '<div class="p7col"><h3>' + icon("file", 18) + ' Important Notes</h3><div class="p7list">' + notesHtml + '</div></div>' +
        '<div class="p7col"><h3>' + icon("badge-check", 18) + ' Intern Responsibilities</h3><div class="p7list">' + respHtml + '</div></div>' +
        '</div>' +
        '<div class="polstrip">' +
        '<div class="polchip">' + badge("file", 26, false, "#F5F5F5") + '<div><div class="h">Intern Handbook</div><div class="d">Conduct &amp; leave policy</div></div></div>' +
        '<div class="polchip">' + badge("clock", 26, false, "#F5F5F5") + '<div><div class="h">Attendance Policy</div><div class="d">Office timing &amp; leave credits</div></div></div>' +
        '<div class="polchip">' + badge("cpu", 26, false, "#F5F5F5") + '<div><div class="h">IT &amp; Security</div><div class="d">Data &amp; device use</div></div></div>' +
        '</div>' +
        '<div class="helpcard">' +
        '<div class="cols"><div class="h">Need Help? We&rsquo;re One Message Away</div>' +
        '<div class="row7">' + icon("mail", 16, "#ffffff") + ' ' + esc(d.hrEmail) + '</div>' +
        '<div class="row7">' + icon("phone", 16, "#ffffff") + ' ' + val(d.hrPhone) + '</div>' +
        '<div class="row7">' + icon("globe", 16, "#ffffff") + ' ' + esc(d.website) + '</div>' +
        '<div class="row7">' + icon("pin", 16, "#ffffff") + ' ' + esc(d.officeAddress) + '</div>' +
        '<div class="row7">' + icon("siren", 16, "#ffffff") + ' Emergency: ' + val(d.emergencyContact) + '</div></div>' +
        '</div>';
      return page(inner, 7, d, "Letter of Internship");
    }
    export function buildIntern8(d: any) {
      const inner =
        '<h1 class="pt">Acceptance of Offer</h1>' +
        '<div class="statement">I, ' + val(d.candidateName) + ', confirm that I have read, understood, and voluntarily accept the terms of this Letter of Internship and its Annexures, issued by Triple S Production. I understand that a detailed Internship Agreement will be executed separately on or before my date of joining.</div>' +
        '<div class="sigwrap">' +
        '<div class="sigbox"><div class="lbl">For Triple S Production</div><div class="line"></div><div><div class="name">' + val(d.proprietorName) + '</div><div class="date">Founder &nbsp;&middot;&nbsp; Date: ______________</div></div></div>' +
        '<div class="sigbox"><div class="lbl">Intern Signature</div><div class="line"></div><div><div class="name">' + val(d.candidateName) + '</div><div class="date">Date: ______________</div></div></div>' +
        '</div>' +
        '<div class="stamprow">' +
        '<div class="stampbox">' + icon("users", 26, "#bbbbbb") + '<div class="lbl">Witness</div></div>' +
        '<div class="stampbox">' + icon("stamp", 26, "#bbbbbb") + '<div class="lbl">Company Stamp</div></div>' +
        '</div>' +
        '<div class="welcome8"><img class="wm8" src="' + LOGO_WHITE + '"><div class="h">Welcome to Triple S Production</div><div class="d">Let&rsquo;s build something extraordinary, together.</div></div>';
      return page(inner, 8, d, "Letter of Internship");
    }

    // ============== SIMPLE SINGLE-PAGE DOCUMENTS ==============
    function sigPairBlock(companyLabel: string, otherLabel: string, otherName: string, d: any) {
      return '<div class="sigwrap">' +
        '<div class="sigbox"><div class="lbl">' + companyLabel + '</div><div class="line"></div><div><div class="name">' + val(d.proprietorName) + '</div><div class="date">Founder &nbsp;&middot;&nbsp; Date: ______________</div></div></div>' +
        '<div class="sigbox"><div class="lbl">' + otherLabel + '</div><div class="line"></div><div><div class="name">' + val(otherName) + '</div><div class="date">Date: ______________</div></div></div>' +
        '</div>';
    }
    function sigSoloBlock(label: string, d: any) {
      return '<div class="sigwrap"><div class="sigbox" style="max-width:280px;"><div class="lbl">' + label + '</div><div class="line"></div><div><div class="name">' + val(d.proprietorName) + '</div><div class="date">For ' + esc(d.companyName || "Triple S Production") + ' &nbsp;&middot;&nbsp; Date: ______________</div></div></div></div>';
    }

    const DEPT_PROFILES = {
      "Development": {
        ipFocus: "source code, technical architecture, system designs, and any software or tools built during employment",
        confFocus: "source code repositories, API keys, credentials, and technical infrastructure",
        responsibilities: "software development, code review, and quality assurance tasks",
        checklistExtra: "GitHub / portfolio profile link"
      },
      "Content": {
        ipFocus: "creative content, designs, videos, copywriting, and campaign material produced during employment",
        confFocus: "creative concepts, brand assets, campaign strategies, and client creative briefs",
        responsibilities: "content creation, design, and campaign execution tasks",
        checklistExtra: "Design / video portfolio link"
      }
    };
    function deptProfile(d: any): any {
      return (DEPT_PROFILES as any)[d.department] || {
        ipFocus: "work product, deliverables, and material produced during employment",
        confFocus: "client information, project material, and internal business data",
        responsibilities: "assigned tasks and projects",
        checklistExtra: null
      };
    }

    export function buildEmployeeAgreement(d: any) {
      const city = esc((d.officeAddress || "Satara").split(",").pop().trim() || "Satara");
      const page1 =
        '<h1 class="pt">Employee Agreement</h1>' +
        '<p class="body">This Employment Agreement (&ldquo;Agreement&rdquo;) is made on ' + val(d.letterDate) + ' between <strong>Triple S Production</strong> (&ldquo;the Company&rdquo;) and <strong>' + val(d.candidateName) + '</strong> (&ldquo;the Employee&rdquo;), collectively &ldquo;the Parties&rdquo;.</p>' +
        '<p class="body"><strong>1. Appointment.</strong> The Company appoints the Employee, and the Employee accepts appointment, as ' + val(d.designation) + ' in the ' + val(d.department) + ' department, reporting to ' + val(d.reportingManager) + ', effective from ' + val(d.dateOfJoining) + '.</p>' +
        '<p class="body"><strong>2. Term &amp; Probation.</strong> The Employee shall be on probation for ' + val(d.probationPeriod) + ' from the date of joining, during which either Party may terminate this Agreement with 7 days&rsquo; written notice. On successful completion of probation, the appointment shall be confirmed in writing.</p>' +
        '<p class="body"><strong>3. Place of Work &amp; Working Hours.</strong> The Employee shall be based at the Company&rsquo;s ' + val(d.officeLocation) + ', working ' + val(d.workingHours) + ', and may be assigned to remote or hybrid work at the Company&rsquo;s discretion.</p>' +
        '<p class="body"><strong>4. Remuneration.</strong> The Employee shall be paid an annual compensation of &#8377;' + val(d.ctcAmount) + ', payable monthly, subject to applicable statutory deductions and periodic review at the Company&rsquo;s discretion.</p>';
      const dp = deptProfile(d);
      const page2 =
        '<p class="body"><strong>5. Working Hours &amp; Time Credit.</strong> The Employee shall log a minimum of 8 active working hours per working day through the Company&rsquo;s time-tracking system. Active hours logged beyond 8 in a day shall accrue as time credit, at the rate of 8 accrued credit hours equalling 1 day of leave, redeemable subject to Company approval. Unapproved or uninformed absence, and any shortfall against the required monthly hours, shall result in a proportionate deduction from salary in line with the Payment of Wages Act and the Company&rsquo;s wage deduction policy. Medical leave may be treated as paid leave at the Company&rsquo;s discretion, subject to supporting documentation.</p>' +
        '<p class="body"><strong>6. Confidentiality.</strong> The Employee shall not, during employment or at any time thereafter, disclose or use for any purpose other than the Company&rsquo;s business, any confidential information relating to the Company or its clients, including ' + dp.confFocus + ', pricing, and internal processes.</p>' +
        '<p class="body"><strong>7. Intellectual Property &amp; Portfolio Restriction.</strong> All ' + dp.ipFocus + ' shall be the sole property of the Company or its clients. The Employee shall not use, reproduce, publish, or showcase any client deliverable or Company project in a personal portfolio, social media, or any third-party context, whether during or after employment, without the Company&rsquo;s prior written approval. This obligation survives termination indefinitely for client-confidential material.</p>' +
        '<p class="body"><strong>8. Non-Solicitation.</strong> For 12 months following termination for any reason, the Employee shall not, directly or indirectly, solicit any client or employee of the Company for a competing engagement.</p>';
      const page3 =
        '<p class="body"><strong>9. Termination.</strong> This Agreement may be terminated by either Party giving ' + esc(d.noticePeriod) + '&rsquo;s written notice, or payment in lieu at the Company&rsquo;s discretion. The Company may terminate without notice for material breach, including breach of Clause 6 or Clause 7.</p>' +
        '<p class="body"><strong>10. Remedies for Breach.</strong> Breach of Clause 6, 7, or 8 may cause harm to the Company for which damages alone may not be adequate. The Company shall be entitled to seek injunctive relief, in addition to damages and any other remedy available in law.</p>' +
        '<p class="body"><strong>11. Indemnity.</strong> The Employee shall indemnify the Company against loss, damage, or liability arising from the Employee&rsquo;s negligence, misconduct, or breach of this Agreement.</p>' +
        '<p class="body"><strong>12. Notices.</strong> Any notice under this Agreement shall be in writing and delivered by hand, email, or registered post to the last known address of the recipient.</p>' +
        '<p class="body"><strong>13. Governing Law &amp; Jurisdiction.</strong> This Agreement is governed by the laws of India, and the courts at ' + city + ' shall have exclusive jurisdiction over disputes arising hereunder.</p>' +
        '<p class="body"><strong>14. Entire Agreement.</strong> This Agreement, with the Company&rsquo;s referenced policies, is the entire understanding between the Parties. If any provision is held invalid, the remaining provisions continue in full force.</p>' +
        '<div class="reviewflag" style="margin:6mm 0;">&#9888; Have this Agreement reviewed by a lawyer or Company Secretary before use.</div>' +
        sigPairBlock("For Triple S Production", "Employee Signature", d.candidateName, d);
      return page(page1, 1, d, "Employee Agreement", 3) + page(page2, 2, d, "Employee Agreement", 3) + page(page3, 3, d, "Employee Agreement", 3);
    }

    export function buildBackgroundVerification(d: any) {
      const dp = deptProfile(d);
      const docs = [
        "Aadhar card", "PAN card", "Most recent resume",
        "Latest experience letter (if applicable)", "Relieving letter from previous employer (if applicable)",
        "Most recent education certificate"
      ];
      if (dp.checklistExtra) docs.push(dp.checklistExtra);
      const list = docs.map(function (n) { return '<div class="p7item"><div class="dot"></div><div>' + n + '</div></div>'; }).join("");
      const inner =
        '<h1 class="pt">Pre-Employment Document Checklist</h1>' +
        '<p class="body">Candidate: <b>' + val(d.candidateName) + '</b>. Please submit the following documents prior to your date of joining; these will be verified by the Company.</p>' +
        '<div class="p7list" style="margin-bottom:6mm;">' + list + '</div>' +
        '<div class="banner">' + badge("badge-check", 32) + '<div>I confirm the above documents are true copies of originals.</div></div>' +
        sigSoloBlock("Candidate Signature", d);
      return page(inner, 1, d, "Background Verification Checklist", 1);
    }

    export function buildHandbookAck(d: any) {
      const items = [
        ["clock", "Working Hours &amp; Time Credit", "8 active hours/day required; hours beyond 8 accrue as credit (8 credits = 1 day of leave), redeemable as approved by the Company."],
        ["calendar", "Leave &amp; Attendance", "No official paid leave beyond the credit system. Medical leave may be paid at the Company's discretion, subject to documentation. Unapproved absence attracts disciplinary action."],
        ["file", "Salary &amp; Deductions", "Salary is based on completing required monthly hours; shortfalls, unapproved leave, and loss or damage to Company property may result in a proportionate salary deduction."],
        ["users", "Code of Conduct", "Employees are expected to maintain professional conduct, punctuality, and respect for colleagues and clients at all times."],
        ["shield", "Confidentiality &amp; Portfolio Policy", "Client and Company information must stay confidential. No project may be used in a personal portfolio or shared externally without written approval."],
        ["cpu", "IT &amp; Data Security", "Company tools, credentials, and devices must be used responsibly and only for authorised business purposes."],
        ["clipboard", "Disciplinary Action &amp; Grievance", "Breach of policy may lead to disciplinary action up to termination; employees may raise workplace concerns with HR or their manager."]
      ];
      const cards = items.map(function (it) {
        return '<div class="lcard">' + badge(it[0], 36) + '<div><div class="h">' + it[1] + '</div><div class="d">' + it[2] + '</div></div></div>';
      }).join("");
      const page1 =
        '<h1 class="pt">Employee Handbook &mdash; Policy Summary</h1>' +
        '<p class="body">This page summarises the key policies that apply to every employee at Triple S Production. The complete policy text is maintained by HR and referenced in your Employee Agreement.</p>' +
        '<div class="lgrid">' + cards + '</div>';
      const page2 =
        '<h1 class="pt">Acknowledgment of Employee Handbook</h1>' +
        '<p class="body">I, ' + val(d.candidateName) + ', confirm that I have received, read, and understood the Triple S Production Employee Handbook, including the policies summarised on the preceding page, covering working hours, leave, deductions, code of conduct, confidentiality, IT security, and disciplinary procedures.</p>' +
        '<div class="banner">' + badge("file", 32) + '<div>This Handbook forms part of the terms of my employment. Continued employment is conditional on compliance with it.</div></div>' +
        sigSoloBlock("Employee Signature", d);
      return page(page1, 1, d, "Handbook Acknowledgment", 2) + page(page2, 2, d, "Handbook Acknowledgment", 2);
    }

    export function buildPayrollForm(d: any) {
      const inner =
        '<h1 class="pt">Payroll Registration Form</h1>' +
        '<div class="infocard2"><div class="hd2">' + icon("file", 16, "#ffffff") + ' Bank &amp; Tax Details</div><div class="rows">' +
        '<div class="row2">' + badge("user", 30, false, "#F5F5F5") + '<div><div class="lbl">Name</div><div class="val">' + val(d.candidateName) + '</div></div></div>' +
        '<div class="row2">' + badge("briefcase", 30, false, "#F5F5F5") + '<div><div class="lbl">Designation</div><div class="val">' + val(d.designation) + '</div></div></div>' +
        '<div class="row2">' + badge("file", 30, false, "#F5F5F5") + '<div><div class="lbl">Bank Name</div><div class="val">' + val(d.bankName) + '</div></div></div>' +
        '<div class="row2">' + badge("clipboard", 30, false, "#F5F5F5") + '<div><div class="lbl">Account Number</div><div class="val">' + val(d.accountNumber) + '</div></div></div>' +
        '<div class="row2">' + badge("cpu", 30, false, "#F5F5F5") + '<div><div class="lbl">IFSC Code</div><div class="val">' + val(d.ifsc) + '</div></div></div>' +
        '<div class="row2">' + badge("badge-check", 30, false, "#F5F5F5") + '<div><div class="lbl">PAN</div><div class="val">' + val(d.pan) + '</div></div></div>' +
        '</div></div>' +
        '<p class="body" style="margin-top:6mm;">I confirm the above details are accurate and authorise Triple S Production to process my monthly salary to this account.</p>' +
        sigSoloBlock("Employee Signature", d);
      return page(inner, 1, d, "Payroll Registration Form", 1);
    }

    export function buildBondAgreement(d: any) {
      const city = esc((d.officeAddress || "Satara").split(",").pop().trim() || "Satara");
      const page1 =
        '<h1 class="pt">Service Bond Agreement</h1>' +
        '<p class="body">This Service Bond Agreement is executed on ' + val(d.letterDate) + ' by <strong>' + val(d.candidateName) + '</strong> (&ldquo;the Employee&rdquo;), appointed as ' + val(d.designation) + ' at Triple S Production (&ldquo;the Company&rdquo;), effective from ' + val(d.dateOfJoining) + '.</p>' +
        '<p class="body"><strong>1. Recital.</strong> The Company has invested in the Employee&rsquo;s training and development, specifically: ' + val(d.trainingDescription) + '. In consideration of this investment, the Employee agrees to the terms below.</p>' +
        '<p class="body"><strong>2. Minimum Service Period.</strong> The Employee agrees to serve the Company for a minimum continuous period of ' + val(d.bondDurationMonths) + ' months from the date of joining (&ldquo;the Bonded Period&rdquo;).</p>' +
        '<p class="body"><strong>3. Recovery on Early Exit.</strong> Should the Employee resign, or be terminated for cause, before completing the Bonded Period, the Employee agrees to reimburse the Company &#8377;' + val(d.bondAmount) + '. This amount represents a genuine pre-estimate of the Company&rsquo;s training and recruitment costs, and is not a penalty.</p>' +
        '<p class="body"><strong>4. Confidentiality.</strong> The confidentiality and intellectual property obligations in the Employee&rsquo;s Employment Agreement continue to apply in full during the Bonded Period and thereafter.</p>';
      const page2 =
        '<p class="body"><strong>5. No Restriction Beyond the Bonded Period.</strong> This bond does not restrict the Employee&rsquo;s right to seek or accept employment elsewhere after completion of the Bonded Period, and does not survive beyond its stated duration.</p>' +
        '<p class="body"><strong>6. Dispute Resolution.</strong> In the event of a dispute regarding recovery under this bond, the Parties agree to first attempt resolution through good-faith discussion before pursuing any other remedy.</p>' +
        '<p class="body"><strong>7. Governing Law.</strong> This bond is governed by the laws of India, including the Indian Contract Act, 1872, and is subject to the jurisdiction of the courts at ' + city + '.</p>' +
        '<div class="reviewflag" style="margin:6mm 0;">&#9888; Have this Bond Agreement reviewed by a lawyer before use &mdash; the recovery amount must reflect genuine costs to be enforceable.</div>' +
        sigPairBlock("For Triple S Production", "Employee Signature", d.candidateName, d);
      return page(page1, 1, d, "Service Bond Agreement", 2) + page(page2, 2, d, "Service Bond Agreement", 2);
    }

    export function buildRelievingLetter(d: any) {
      const inner =
        '<h1 class="pt">Relieving Letter</h1>' +
        '<p class="body" style="margin-bottom:1mm;">To,<br>' + val(d.candidateName) + '<br>' + val(d.designation) + ', ' + val(d.department) + '</p>' +
        '<div class="subjectline">Subject: Relieving Letter</div>' +
        '<p class="body">Dear ' + val(d.candidateName) + ',</p>' +
        '<p class="body">This is to confirm that you were employed with Triple S Production as ' + val(d.designation) + ' from ' + val(d.dateOfJoining) + ' to ' + val(d.lastWorkingDay) + '.</p>' +
        '<p class="body">With reference to your resignation letter dated ' + val(d.resignationDate) + ', your resignation has been accepted, and you have completed your notice period as per the terms of your Employment Agreement. You have been relieved of all duties with effect from the close of business on ' + val(d.lastWorkingDay) + ', having completed all exit formalities and handover requirements to the Company&rsquo;s satisfaction.</p>' +
        '<p class="body">Your full and final settlement, including salary and any applicable dues, will be processed as per Company policy.</p>' +
        '<p class="body">We thank you for your contribution during your tenure and wish you success in your future endeavours.</p>' +
        '<div class="sig2"><div><div class="name">' + val(d.proprietorName) + '</div><div class="role">Founder, Triple S Production</div></div>' +
        '<div style="text-align:right;"><div class="role">Signed &amp; issued on</div><div class="name">' + val(d.letterDate) + '</div></div></div>';
      return page(inner, 1, d, "Relieving Letter", 1);
    }

    export function buildInternshipCompletion(d: any) {
      const dp = deptProfile(d);
      const resp = (d.keyResponsibilities && d.keyResponsibilities.trim()) ? esc(d.keyResponsibilities) : dp.responsibilities + " within the " + val(d.department) + " team";
      const inner =
        '<h1 class="pt">Internship Completion Letter</h1>' +
        '<p class="body" style="margin-bottom:1mm;">To,<br>' + val(d.candidateName) + '</p>' +
        '<div class="subjectline">Subject: Completion of Internship</div>' +
        '<p class="body">Dear ' + val(d.candidateName) + ',</p>' +
        '<p class="body">This is to confirm that you completed an internship with Triple S Production from ' + val(d.dateOfJoining) + ' to ' + val(d.lastWorkingDay) + ', during which you were involved in ' + resp + '.</p>' +
        '<p class="body">You have fulfilled all requirements of the internship to the Company&rsquo;s satisfaction, and all handover formalities have been completed.</p>' +
        '<p class="body">We wish you success in your future endeavours.</p>' +
        '<div class="sig2"><div><div class="name">' + val(d.proprietorName) + '</div><div class="role">Founder, Triple S Production</div></div>' +
        '<div style="text-align:right;"><div class="role">Signed &amp; issued on</div><div class="name">' + val(d.letterDate) + '</div></div></div>';
      return page(inner, 1, d, "Internship Completion Letter", 1);
    }

    export function buildExperienceLetter(d: any) {
      const dp = deptProfile(d);
      const perf = (d.performanceNote && d.performanceNote.trim()) ? esc(d.performanceNote) : "was diligent, professional, and a valued member of the team";
      const resp = (d.keyResponsibilities && d.keyResponsibilities.trim()) ? esc(d.keyResponsibilities) : dp.responsibilities + " as " + val(d.designation);
      const inner =
        '<h1 class="pt">Experience Certificate</h1>' +
        '<div class="subjectline"><u>To Whomsoever It May Concern</u></div>' +
        '<p class="body">This is to certify that <strong>' + val(d.candidateName) + '</strong> was employed with Triple S Production as ' + val(d.designation) + ' from ' + val(d.dateOfJoining) + ' to ' + val(d.lastWorkingDay) + '.</p>' +
        '<p class="body">During this tenure, ' + val(d.candidateName) + ' was responsible for ' + resp + '.</p>' +
        '<p class="body">Throughout the tenure, ' + val(d.candidateName) + ' ' + perf + '.</p>' +
        '<p class="body">We wish ' + val(d.candidateName) + ' continued success in their career.</p>' +
        '<div class="sig2"><div><div class="name">' + val(d.proprietorName) + '</div><div class="role">Founder, Triple S Production</div></div>' +
        '<div style="text-align:right;"><div class="role">Signed &amp; issued on</div><div class="name">' + val(d.letterDate) + '</div></div></div>';
      return page(inner, 1, d, "Experience Certificate", 1);
    }

    export function buildInternshipCertificate(d: any) {
      const dp = deptProfile(d);
      const perf = (d.performanceNote && d.performanceNote.trim()) ? esc(d.performanceNote) : "demonstrated strong learning ability and contributed meaningfully to assigned projects";
      const resp = (d.keyResponsibilities && d.keyResponsibilities.trim()) ? esc(d.keyResponsibilities) : "supporting the " + val(d.department) + " team with " + dp.responsibilities;
      const inner =
        '<h1 class="pt">Certificate of Internship</h1>' +
        '<div class="subjectline">To Whomsoever It May Concern</div>' +
        '<p class="body">This is to certify that <strong>' + val(d.candidateName) + '</strong> undertook an internship at Triple S Production from ' + val(d.dateOfJoining) + ' to ' + val(d.lastWorkingDay) + ', where they were engaged in ' + resp + '.</p>' +
        '<p class="body">During this period, ' + val(d.candidateName) + ' ' + perf + '.</p>' +
        '<div class="sig2"><div><div class="name">' + val(d.proprietorName) + '</div><div class="role">Founder, Triple S Production</div></div>' +
        '<div style="text-align:right;"><div class="role">Signed &amp; issued on</div><div class="name">' + val(d.letterDate) + '</div></div></div>';
      return page(inner, 1, d, "Certificate of Internship", 1);
    }

    export function buildContinuingObligation(d: any) {
      const obligations = [
        "Confidentiality regarding client information, project material, and internal business data of the Company, without limitation of time.",
        "The restriction on using, reproducing, publishing, or showcasing any client deliverable or Company project in a personal portfolio, social media, or any third-party context, without the Company's prior written approval.",
        "Non-solicitation of the Company's clients or employees for 12 months from your last working day."
      ];
      const list = obligations.map(function (n) { return '<div class="p7item"><div class="dot"></div><div>' + n + '</div></div>'; }).join("");
      const inner =
        '<h1 class="pt">Reminder of Continuing Obligations</h1>' +
        '<p class="body">Dear ' + val(d.candidateName) + ',</p>' +
        '<p class="body">As you leave Triple S Production, we would like to remind you that certain obligations under your Employee Agreement dated ' + val(d.dateOfJoining) + ' survive the end of your employment, specifically:</p>' +
        '<div class="p7list" style="margin-bottom:6mm;">' + list + '</div>' +
        '<p class="body">We trust you will continue to honour these obligations, and wish you success in your future endeavours.</p>' +
        '<div class="sig2"><div><div class="name">' + val(d.proprietorName) + '</div><div class="role">Founder, Triple S Production</div></div>' +
        '<div style="text-align:right;"><div class="role">Signed &amp; issued on</div><div class="name">' + val(d.letterDate) + '</div></div></div>';
      return page(inner, 1, d, "Continuing Obligation Reminder", 1);
    }

    

export const builders = {
  'offer-fulltime': (d: any) => buildPage1(d) + buildPage2(d) + buildPage3(d) + buildPage4(d) + buildPage5(d) + buildPage6(d) + buildPage7(d) + buildPage8(d),
  'offer-internship': (d: any) => buildIntern1(d) + buildIntern2(d) + buildIntern3(d) + buildIntern4(d) + buildIntern5(d) + buildIntern6(d) + buildIntern7(d) + buildIntern8(d),
  'employee-agreement': buildEmployeeAgreement,
  'background-verification': buildBackgroundVerification,
  'handbook-ack': buildHandbookAck,
  'payroll-form': buildPayrollForm,
  'bond-agreement': buildBondAgreement,
  'relieving-letter': buildRelievingLetter,
  'internship-completion': buildInternshipCompletion,
  'experience-letter': buildExperienceLetter,
  'internship-certificate': buildInternshipCertificate,
  'continuing-obligation': buildContinuingObligation
};
