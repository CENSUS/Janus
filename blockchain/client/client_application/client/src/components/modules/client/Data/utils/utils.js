import React from "react";
import withStyles from "@material-ui/core/styles/withStyles";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import Paper from "@material-ui/core/Paper";
import { VerticalTabs, HorizontalTabs } from "./TabPanel";

export const StyledTable = withStyles(() => ({
    root: {
        width: "100%",
        display: "flex",
        overflow: "auto",
        flexDirection: "column",
        margin: "auto",
    },
}))(Table);

export const StyledTableHead = withStyles(() => ({
    root: { width: "100%" },
}))(TableHead);

export const StyledTableHeaderCell = withStyles((theme) => ({
    root: { width: "100%", color: "white" },
    stickyHeader: {
        backgroundColor: theme.palette.primary.main,
    },
}))(TableCell);

export const StyledTableCell = withStyles((theme) => ({
    root: { width: "100%" },
    head: {
        backgroundColor: theme.palette.common.black,
        color: theme.palette.common.white,
    },
    body: {
        fontSize: 14,
        width: "100%",
    },
}))(TableCell);

export const StyledTableRow = withStyles((theme) => ({
    root: {
        display: "flex",
        "&:nth-of-type(odd)": {
            backgroundColor: theme.palette.action.hover,
        },
    },
}))(TableRow);

export function tableConstruct(tableName, arrayData) {
    return (
        <TableContainer component={Paper}>
            <StyledTable size="small" stickyHeader>
                <StyledTableHead>
                    <TableRow>
                        <StyledTableHeaderCell align="center">
                            {tableName.replace(/_/g, " ").toUpperCase()}
                        </StyledTableHeaderCell>
                    </TableRow>
                </StyledTableHead>
                <TableBody>
                    {Array.isArray(arrayData)
                        ? arrayData.map((obj) => obj)
                        : arrayData}
                </TableBody>
            </StyledTable>
        </TableContainer>
    );
}

export function newTableBodyConstruct(obj) {
    return (
        <StyledTableRow key={obj.name}>
            <StyledTableCell component="th" scope="row">
                {obj.name.replace(/_/g, " ")}
            </StyledTableCell>
            <StyledTableCell align="center">{obj.data}</StyledTableCell>
        </StyledTableRow>
    );
}

function resolveOrganization(uuid, organizations) {
    return (
        Object.values(organizations)
            .flat()
            .filter((org) => org.uuid === uuid)[0] || "Unknown"
    );
}

export function updateOrganizationFromUUID(object, organizations) {
    if (typeof object === "object") {
        const organization = object["organization_uuid"]
            ? resolveOrganization(object["organization_uuid"], organizations)
            : "Check Transaction Details";
        object["organization"] = organization.name || organization;
    }
}

function constructNestedTable(object, shouldUseTabPanel = false) {
    // const nestedTable = <HorizontalTabs data={constructData(object["data"])} />;
    let transformedData = constructData(object["data"]);

    function constructData(data) {
        if (typeof data === "object") {
            if (Array.isArray(data)) {
                return data.map((elem) => {
                    if (elem["hasChildren"]) {
                        return Object.values(elem["data"]).map((nestedElem) =>
                            constructData(nestedElem)
                        );
                    }
                    return constructData(elem["data"]);
                });
            } else if (data["hasChildren"]) {
                return Object.values(data["data"]).map((nestedElem) =>
                    constructData(nestedElem)
                );
            }
            return newTableBodyConstruct(data);
        }
    }

    if (shouldUseTabPanel)
        transformedData = <HorizontalTabs data={transformedData} />;
    return transformedData;
}

function examineAndModifyObject(data) {
    // Nests an Object that exists under a Root Element into an Array ((e.g. { rootElement: { Object: {} } }) => { rootElement: { Object: [ {} ] } }))
    // This is crucial in order to construct the available Data into Tables!
    Object.keys(data)
        .filter((key) => typeof data[key] === "object")
        .map((filteredKey) =>
            Object.keys(data[filteredKey])
                .filter(
                    (nestedKey) =>
                        typeof data[filteredKey][nestedKey] === "object" &&
                        !Array.isArray(data[filteredKey][nestedKey])
                )
                .map(
                    (nestedElem) =>
                        (data[filteredKey][nestedElem] = [
                            data[filteredKey][nestedElem],
                        ])
                )
        );

    // Transforms a Root Element from an Array into an Object (e.g. { rootElement: [] } => { rootElement: `rootElementName: {}` })
    Object.keys(data)
        .filter((key) => Array.isArray(data[key]))
        .map(
            (filteredKey) =>
                (data[filteredKey] = { [filteredKey]: data[filteredKey] })
        );
}

export function constructTable(data) {
    const rootElementsMerged = data
        .filter((obj) => obj.isDirectChildToRoot && !obj.hasChildren)
        .map((obj) => newTableBodyConstruct(obj));

    const rootElementsMerged_Table = tableConstruct(
        "Information",
        rootElementsMerged
    );

    const rootElementsMergedNested = data
        .filter((obj) => obj.isDirectChildToRoot && obj.hasChildren)
        .map((obj) => ({ rootName: obj.name, objData: obj.data }))
        .map(({ rootName, objData }) => ({
            rootName,
            objTrElemsData: Object.keys(objData)
                .filter((elem) => !objData[elem].hasChildren)
                .map((elem) => newTableBodyConstruct(objData[elem])),
        }))
        .map(({ rootName, objTrElemsData }) =>
            tableConstruct(rootName, objTrElemsData)
        );

    // These are merged elements that we don't know their depth
    const elementsMergedNested = data
        .filter((obj) => obj.isDirectChildToRoot && obj.hasChildren)
        .map((obj) => obj.data)
        .map((obj) =>
            Object.values(obj)
                .filter((elem) => elem.hasChildren)
                .map((obj) => ({
                    name: obj.name,
                    data: constructNestedTable(obj, true),
                }))
        )
        .map((arrayOfObjects) => <VerticalTabs data={arrayOfObjects} />);

    return [
        rootElementsMerged_Table,
        rootElementsMergedNested,
        elementsMergedNested,
    ];
}

export function tagData(
    name,
    data,
    hasChildren = false,
    isParent = false,
    isDirectChildToParent = false,
    isDirectChildToRoot = false
) {
    return {
        name,
        data,
        hasChildren,
        isParent,
        isDirectChildToParent,
        isDirectChildToRoot,
    };
}

// A response may not include a JSON Object - Thus, create an Object based on the response's value and give it a generic (key) name `RESPONSE`
const checkIfObject = (data) =>
    typeof data === "object" ? data : { RESPONSE: data };

// A response may include Boolean data - Need to transform from Boolean to String
const checkIfBooleanOrNull = (data) =>
    typeof data === "boolean"
        ? data
            ? "YES"
            : "NO"
        : typeof data !== "number"
        ? data
            ? data
            : "-"
        : data;

export function constructResponse(decryptedData, organizations) {
    let constructedTables = [];
    let iteratedObject = {};
    let keysToRemove = [];

    function constructData(object, nestedIterObject = {}) {
        for (const key in object) {
            if (typeof object[key] !== "object" || !object[key])
                object[key] = checkIfBooleanOrNull(object[key]);

            if (Array.isArray(object[key])) {
                for (const [index, objElem] of object[key].entries()) {
                    const rowData = constructData(objElem); // Add `objElem` to split grouped data
                    object[key][index] = tagData(key, rowData, true, true);
                }
                if (nestedIterObject[key] === object[key]) {
                    object[key] = tagData(
                        key,
                        object[key],
                        true,
                        true,
                        false,
                        false
                    ); // Turn a `parent` array into an object
                }
                continue;
            } else if (typeof object[key] === "object") {
                if (nestedIterObject[key] === object[key]) {
                    const rowData = constructData(object[key]);
                    object[key] = tagData(
                        key,
                        rowData,
                        true,
                        false,
                        false,
                        false
                    );
                } else if (iteratedObject[key] === object[key]) {
                    const rowData = constructData(object[key], object[key]);
                    object[key] = tagData(
                        key,
                        rowData,
                        true,
                        false,
                        false,
                        true
                    );
                } else {
                    const rowData = constructData(object[key]);
                    object[key] = tagData(key, rowData, true, false, true);
                }
                continue;
            }

            object[key] = tagData(
                key.toUpperCase(),
                object[key],
                false,
                false,
                false,
                iteratedObject[key] === object[key]
            );
        }

        return object;
    }

    // The `decryptedData` must always be an Array
    for (let object of decryptedData) {
        object = checkIfObject(object);
        examineAndModifyObject(object);
        iteratedObject = object;
        keysToRemove = [];
        updateOrganizationFromUUID(object, organizations);
        let constructedData = constructData(object);
        keysToRemove.forEach((key) => delete constructedData[key]);
        constructedTables.push(constructedData);
    }

    return constructedTables;
}
