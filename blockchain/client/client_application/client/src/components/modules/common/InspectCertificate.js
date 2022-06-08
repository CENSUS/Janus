import React from "react";
import Paper from "@material-ui/core/Paper";
import Table from "@material-ui/core/Table";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableRow from "@material-ui/core/TableRow";
const { Certificate } = require("@fidm/x509");

export default function InspectCertificate({ certificate }) {
    const constructedCertificate = Certificate.fromPEM(certificate);

    return (
        <TableContainer component={Paper}>
            <Table>
                <TableRow>
                    <TableCell variant="head">Organization</TableCell>
                    <TableCell>
                        {constructedCertificate.issuer.organizationName}
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableCell variant="head">Issuer</TableCell>
                    <TableCell>
                        {constructedCertificate.issuer.commonName}
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableCell variant="head">User</TableCell>
                    <TableCell>
                        {constructedCertificate.subject.commonName}
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableCell variant="head">Type</TableCell>
                    <TableCell>
                        {constructedCertificate.subject.organizationalUnitName}
                    </TableCell>
                </TableRow>
            </Table>
        </TableContainer>
    );
}
