"use client";

import { useCallback, useEffect, useState } from "react";

const buildDummyTicket = () => ({
	v_ticketid: 92503,
	v_ticketuuid: 'c53c1224-e79d-4474-8f2f-a5e60a29dfae',
	v_ticketnumber: 'T20260502.0869',
	v_technicianid: null,
	v_technicianname: 'John Doe',
	v_target: '2026-05-03T05:55:26Z',
	v_ticketlifecycle: 'Closed',
	v_ticketcategory: 'Triage',
	v_source: 'Power Intake',
	v_priority: 'P2 Normal Response',
	v_status: 'Resolved',
	v_ticketstatus: 'Resolved',
	v_closurenote: null,
	v_closuredate: null,
	v_resolutionsummary: null,
	v_airouted: null,
	v_userid: 51733,
	v_entrauserid: '4d7a8c7c-a2cb-4703-a06f-072561fd1475',
	v_username: 'Example Demo User',
	v_jobtitle: 'Developer',
	v_useremail: 'Demo.User@Example.com',
	v_department: 'Power Studio',
	v_mobilephone: null,
	v_businessphone: null,
	v_title: 'Example Ticket for Tutorial',
	v_description: 'Example description of the ticket goes here.',
	v_usertimezone: 'Asia/Singapore',
	v_officelocation: 'remote',
	v_tenantid: 17679,
	v_entratenantid: '1159156a-3971-429d-bb02-bd37b1223d24',
	v_tenantname: 'Sparta Services LLC',
	v_tenantemail: null,
	v_createdat: '2026-05-02T05:55:22.574Z',
	v_createdby: 'a22c163e-5cf1-457d-9248-ae262f053de6',
	v_modifiedat: '2026-05-02T05:56:03.881Z',
	v_modifiedby: null,
	v_supportcalls: [
		{
			v_date: '2026-05-02',
			v_endtime: '16:30:00',
			v_createdat: '2026-05-02T05:55:22.5745+00:00',
			v_createdby: '4d7a8c7c-a2cb-4703-a06f-072561fd1475',
			v_starttime: '14:30:00',
			v_supportcallid: 1231,
			v_supportcalluuid: '2011fb93-0af6-4038-bd30-8329853c97a3',
		},
	],
});

export function useDemoTicketTutorial({ onOpen } = {}) {
	const [dummyTicket, setDummyTicket] = useState(null);
	const [dummyDialogOpen, setDummyDialogOpen] = useState(false);

	const injectDummy = useCallback(() => {
		setDummyTicket((prev) => prev ?? buildDummyTicket());
		setDummyDialogOpen(false);
	}, []);

	const openDummyDialog = useCallback(() => {
		setDummyTicket((prev) => prev ?? buildDummyTicket());
		setDummyDialogOpen(true);
		onOpen?.();
	}, [onOpen]);

	const closeDummyDialog = useCallback(() => {
		setDummyDialogOpen(false);
	}, []);

	const removeDummy = useCallback(() => {
		setDummyTicket(null);
		setDummyDialogOpen(false);
	}, []);

	useEffect(() => {
		window.__tutorialInjectDummy = injectDummy;
		window.__tutorialOpenDummyTicket = openDummyDialog;
		window.__tutorialCloseDummyTicket = closeDummyDialog;
		window.__tutorialRemoveDummy = removeDummy;

		return () => {
			delete window.__tutorialInjectDummy;
			delete window.__tutorialOpenDummyTicket;
			delete window.__tutorialCloseDummyTicket;
			delete window.__tutorialRemoveDummy;
		};
	}, [injectDummy, openDummyDialog, closeDummyDialog, removeDummy]);

	return {
		dummyTicket,
		dummyDialogOpen,
		injectDummy,
		openDummyDialog,
		closeDummyDialog,
		removeDummy,
	};
}
