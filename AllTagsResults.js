import React, {Component} from "react";
import PropTypes from "prop-types";
import ajaxCall from "../utility/ajaxCall";
import Modal from "../utility/Modal";
import TagCodeModal from "../utility/TagCodeModal.js";
import Scan from "../utility/Scan";
import {connect} from "react-redux";
import {constants} from "../utility/Violation";
import iconMal from "../../../../src/img/Mal_1.svg";
import iconHigh from "../../../../src/img/high_p.svg";
import iconMid from "../../../../src/img/mid_p.svg";
import iconLow from "../../../../src/img/low_p.svg";
import universalFunctions from "../utility/UniversalFunctions";

import {library} from '@fortawesome/fontawesome-svg-core';
import {
    faEnvelopeOpen,
    faUsers,
    faFileUpload,
    faUser,
    faArrowUp,
    faArrowDown,
    faCheckCircle,
    faTags,
    faQuestion,
    faChevronLeft,
    faMobileAlt,
    faDesktop,
    faWindowRestore,
    faGlobeAmericas,
    faCookieBite,
    faSave,
    faUnlink,
    faFileExport,
    faQuestionCircle,
    faExclamationTriangle
} from "@fortawesome/free-solid-svg-icons/";
import {faChartBar} from "@fortawesome/free-regular-svg-icons/";

library.add(faEnvelopeOpen, faUsers, faFileUpload,faExclamationTriangle, faFileExport, faQuestionCircle, faUser, faChartBar, faArrowUp, faArrowDown, faCheckCircle, faTags, faQuestion, faChevronLeft, faMobileAlt, faDesktop, faWindowRestore, faGlobeAmericas, faCookieBite);
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
const queryString = require('query-string');

class AllTagsResults extends React.Component {
    constructor(props) {
        super(props);
        const filters = queryString.parse(location.search);
        this.myScrollRef = React.createRef();
        this.state = {
            tagTitle: (this.props.tagTitle ? this.props.tagTitle : null),
            tagStatus: this.props.tagStatus !== undefined ? this.props.tagStatus : null,
            scanList: null,
            tag_md5sum: (this.props.tag_md5sum ? this.props.tag_md5sum : null),
            tagIsPaused: (this.props.tagIsPaused ? this.props.tagIsPaused : null),
            scans: [],
            tagIds: [],
            btnMassExportEnabled: false,
            currentOpenCsid: filters.csid ? filters.csid : null,
            latestViolationCsid: '',
            massEdit_all: false,
            massEditOption_all: false,
            massSelect_all: false,
            massEditArray_all: [],
            btnExportEnabled: false,
            isOpenAlert: false,
            tagCodeText: [],
            tagCodeHtml: "",
            totalRecords: 0,
            pageSize: 10,
            startRecord: 1,
            endRecord: 10,
            pageNumber: 1,
            limit: 10,
            btnMassEditEnabled: false,
            offset: 0,
            prevPageToggleable: false,
            nextPageToggleable: true,
        };
    }

    updateHistory() {
        let history = {};
        history.csid = this.state.currentOpenCsid;
        history.md5sum = this.state.tag_md5sum;
        this.props.history.push({search: queryString.stringify(history)});
    }

    onChangeTextArea = (event) => {
        this.setState({tagCodeText: event.target.value});
    };

    toggleModal = (event) => {
        this.setState({
            isOpenAlert: !this.state.isOpenAlert,
        });
    };

    showLatestViolation() {
        this.getScan('', this.state.latestViolationCsid);
        this.toggleModal();
    };

    componentDidMount() {
        this.fetchAllResults();
    };

    launchCarousel = (event, elid, dataCarousel) => {
        this.props.launchCarouselImg(event, elid, dataCarousel)
    };
    fetchAllResults() {
        let myResolve = responseData => {
            this.setState({
                scans: (responseData.data ? responseData.data : []),
                totalRecords: this.isNumeric(responseData.list.totalRecords) ? parseInt(responseData.list.totalRecords) : 0,
                latestViolationCsid: responseData.tag.latestViolationCsid,
                tagTitle: (responseData.tag.name !== '' ? responseData.tag.name : this.state.tagTitle),
            }, function () {
                this.updatePageButtons();
            });

            let csidToOpen = (responseData.data ? responseData.data[0].id : '');

            if (!this.state.currentOpenCsid) {
                this.setState({
                    currentOpenCsid: csidToOpen,
                });
                this.getScan('', csidToOpen);
                this.viewTagAffectedModal();
            }
        };
        //Parameters
        let queryParams = this.getFilters();
        new Promise(() => {
            ajaxCall
                .get(queryParams)
                .then(responseData => myResolve(responseData));
        });
    }

    scrollToMyRef = () => {
        this.myScrollRef.current.scrollTop = 0;
    };

    updatePagination() {
        this.setState({
            startRecord: this.state.pageNumber * this.state.pageSize - this.state.pageSize + 1,
            endRecord: this.state.pageNumber * this.state.pageSize,
            limit: this.state.pageSize,
            offset: this.state.pageNumber * this.state.pageSize - this.state.pageSize,
        }, function () {
            this.fetchAllResults();
            this.updatePageButtons();
        });
    }

    /**
     * Enables/disables the page buttons based on total records
     */
    updatePageButtons() {
        this.setState({
            prevPageToggleable: parseInt(this.state.startRecord) > 1,
            nextPageToggleable: parseInt(this.state.endRecord) < parseInt(this.state.totalRecords),
        });
    }

    /**
     * Goes to previous page on our datatable
     * @param event
     */
    prevPage = event => {
        if (this.state.prevPageToggleable) {
            universalFunctions.sendEventGoogleA("All Tags Results Pagination", "Show Previous Page", 1);
            this.setState({pageNumber: this.state.pageNumber - 1}, function () {
                this.updatePagination();
            });
        }
        this.scrollToMyRef();
    };

    /**
     * Goes to next page on our datatable
     * @param event
     */
    nextPage = event => {
        if (this.state.nextPageToggleable) {
            universalFunctions.sendEventGoogleA("All Tags Results Pagination", "Show Next Page", 1);
            this.setState({pageNumber: this.state.pageNumber + 1}, function () {
                this.updatePagination();
            });
        }
        this.scrollToMyRef();
    };

    /**
     * Resets our pagination
     */
    resetPagination() {
        this.state.pageNumber = 1;
    }

    /**
     * Gets the datatable filters
     */
    getFilters() {
        let filters = {};
        filters.limit = this.state.limit;
        filters.offset = this.state.offset;
        filters.md5sum = this.state.tag_md5sum;
        filters.controller = 'tagmanager/scans';
        filters.omit_tag = this.state.tagTitle ? 't' : 'f';
        return filters;
    }

    /**
     * Checks if a variable is numeric
     * @param n
     * @returns {boolean}
     */
    isNumeric(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }

    goBackToTagManager = (e) => {
        this.props.goBackTagManagerHandler()
    };

    checkboxSelectAll = (event) => {
        let checked = event.target.checked;
        if (checked === true) {
            this.setState({
                massSelect_all: true,
                massEdit_all: true
            })
        } else {
            this.setState({
                massSelect_all: false,
                massEdit_all: false
            })
        }
    };

    checkboxTag = (event, id) => {
        let checked = event.target.checked;
        let array = [...this.state.tagIds];
        if (checked === true) {
            let selIds = this.state.tagIds;
            selIds.push(id);
            this.setState({
                massEdit_all: true,
                tagIds: selIds
            });
        } else {
            let index = array.indexOf(id);
            if (index !== -1) {
                array.splice(index, 1);
            }
            if (array.length == 0) {
                this.setState({
                    massEdit_all: false,
                    tagIds: array
                });
            } else {
                this.setState({
                    tagIds: array
                });
            }
        }
    };
    onClickHandlerFilter = (event) => {
        universalFunctions.sendEventGoogleA("Dropdown Filter All Tags Results",event.target.value, 1);
        this.setState({[event.target.name]: event.target.value}, function () {
            this.resetPagination();
            this.updatePagination();
        });
        this.scrollToMyRef();
    };

    viewTagAffectedModal() {
        if (this.state.latestViolationCsid) {
            this.setState({
                isOpenAlert: false, //TODO: If we have a violation CSID, show the modal
            });
        }
    };

    //TODO: Set images for priorities here - data.priority
    setupDataTable() {
        this.state.scanList = this.state.scans.map(data => (
            <div className="all_scan_view" key={data.id}>
                <div className="all_checkbox"><label className="click_cont">
                    <input type="checkbox" name="all_scan_edit" onChange={(e) => {
                        this.checkboxTag(event, data.md5sum)
                    }}
                           checked={this.state.massSelect_all === true ? this.state.massSelect_all : null}/>
                    <span className="checkmark"/></label>
                </div>

                <div
                    className={this.state.currentOpenCsid === data.id ? "all_scan t" + (data.priority != null ? data.priority : 0) + " current_selected" : "all_scan t" + (data.priority != null ? data.priority : 0)}>
                    <div className="priority">
                        {data.priority === "100" ? <img src={iconMal}/>
                            : String(data.priority) === "10" ? <img src={constants.violationImages.low}/>
                                : String(data.priority) === "30" ? <img src={constants.violationImages.medium}/>
                                    : String(data.priority) === "50" ? <img src={constants.violationImages.high}/>
                                        : String(data.priority) === "100" ?
                                            <img src={constants.violationImages.malware}/>
                                            : <div className="all_good_icon">
                                                <FontAwesomeIcon icon={faCheckCircle}/>
                                            </div>}
                    </div>
                    <div className="scan_info">
                        <div className="all_scan_date">{data.timestamp}</div>
                        <div className="all_scan_id">Scan ID: {data.id}</div>
                    </div>
                    <div className="all_scan_buttons">
                        <button onClick={(event) => {
                            this.getScan(event, data.id);
                        }}>View
                        </button>
                    </div>
                </div>
            </div>
        ));
    };

    /**
     * This will load our states scanData object
     * TODO: Ajax call to controller to get the info for the csid
     * @param event
     * @param csid
     */
    getScan = (event, csid) => {
        universalFunctions.sendEventGoogleA("All Results", "View Scan", 1);
        this.setState({
            currentOpenCsid: csid,
        }, function() {
            this.updateHistory();
        })
    };

    //TODO: Refactor this.. it's a mess to just display there are no scans.
    render() {

        if(this.state.scans.length >= 1){
            this.setupDataTable();
            return (
                <div className='all_results'>
                    <div className="all_title">
                        <button className="all_goback" onClick={this.goBackToTagManager.bind(this)}><FontAwesomeIcon icon={faChevronLeft}/> Back</button>
                        <div className="all_tag_title">{this.state.tagTitle}</div>
                    </div>
                    <div className="tag_options_row">
                        <div className="tag_left_tag_options">
                            <div className="tag_sel_all">
                                <label className="click_container">
                                    Select All
                                    <input type="checkbox" onClick={() => this.checkboxSelectAll.bind(this)}/>
                                    <span className="checkmark"/>
                                </label>
                            </div>
                            <div className="tag_mass_edit">
                                <button style={{display: 'none'}} onClick={() => this.exportMass.bind(this)}
                                        disabled={!this.state.massEdit_all}
                                        className={this.state.massEdit_all === false ? "disabled" : ""}
                                        onClick={this.launchMassExport}>Export<FontAwesomeIcon icon={faFileExport} />
                                </button>
                            </div>
                            <div className="tag_pagination">
                                <div
                                    className="tag_list">{this.state.totalRecords === 0 ? 0 : this.state.startRecord} - {(this.state.endRecord < this.state.totalRecords ? this.state.endRecord : universalFunctions.addComma(this.state.totalRecords))} of {universalFunctions.addComma(this.state.totalRecords)}</div>
                                <div className="tag_lr">
                                <span onClick={this.prevPage.bind(this)}
                                      className={this.state.prevPageToggleable ? "left-dir click" : "left-dir"}>&lt;</span>
                                    <span onClick={this.nextPage.bind(this)}
                                          className={this.state.nextPageToggleable ? "right-dir click" : "right-dir"}>&gt;</span>
                                </div>
                                <div className="tag_sel_listings">
                                    <select value={this.state.pageSize} onChange={this.onClickHandlerFilter.bind(this)}
                                            name="pageSize">
                                        <option value="10">10</option>
                                        <option value="25">25</option>
                                        <option value="50">50</option>
                                        <option value="100">100</option>
                                    </select>
                                    <span>Per page</span>
                                </div>
                            </div>
                        </div>
                        <div className="tag_right_tag_options" style={{display: 'none'}}>
                            <button>Need Help<FontAwesomeIcon icon={faQuestionCircle} /></button>
                        </div>
                    </div>
                    <div className="all_results_viewp">
                        <div className="all_tag_listing">
                            <div className="all_scans">
                                <div className="all_scans_scroll"  ref={ this.myScrollRef }>
                                    {this.state.scanList}
                                </div>
                            </div>
                        </div>
                        <div className="all_summary">
                            <div className="all_summary_scroll">
                                <Scan md5sum={this.state.tag_md5sum} key={this.state.currentOpenCsid} csid={this.state.currentOpenCsid} tagTitle={this.state.tagTitle} tagIsPaused={this.state.tagIsPaused} launchCarousel={this.launchCarousel}/>
                            </div>
                        </div>
                    </div>

                    <Modal show={this.state.isOpenAlert} onClose={this.toggleModal}>
                        <div className="malware_alert_modal">
                            <div className="mid important">
                                <FontAwesomeIcon icon={faExclamationTriangle} />
                            </div>
                            <div className="mid important">
                                Violation Alert!
                            </div>
                            <div className="mid info">
                                There is an active violation on this tag. <br/>Would you like to view it?
                            </div>
                            <div className="footer error">
                                <button onClick={(e) => {
                                    this.showLatestViolation()
                                }}>View
                                </button>
                                <button onClick={this.toggleModal}>Cancel</button>
                            </div>
                        </div>
                    </Modal>
                </div>
            )
        } else {
            return (
                <div className='all_results'>
                    <div className="all_title">
                        <button className="all_goback" onClick={this.goBackToTagManager.bind(this)}><FontAwesomeIcon icon={faChevronLeft}/> Back</button>
                        <div className="all_tag_title">{this.state.tagTitle}</div>
                    </div>

                    <div className="tag_options_row">
                        <div className="tag_left_tag_options">
                            <div className="tag_sel_all">
                                <label className="click_container">
                                    Select All
                                    <input type="checkbox" onClick={() => this.checkboxSelectAll.bind(this)}/>
                                    <span className="checkmark"/>
                                </label>
                            </div>
                            <div className="tag_mass_edit">
                                <button style={{display: 'none'}} onClick={() => this.exportMass.bind(this)}
                                        disabled={!this.state.massEdit_all}
                                        className={this.state.massEdit_all === false ? "disabled" : ""}
                                        onClick={this.launchMassExport}>Export<FontAwesomeIcon icon={faFileExport} />
                                </button>
                            </div>
                            <div className="tag_pagination">
                                <div
                                    className="tag_list">{this.state.totalRecords === 0 ? 0 : this.state.startRecord} - {(this.state.endRecord < this.state.totalRecords ? this.state.endRecord : universalFunctions.addComma(this.state.totalRecords))} of {universalFunctions.addComma(this.state.totalRecords)}</div>
                                <div className="tag_lr">
                                <span onClick={this.prevPage.bind(this)}
                                      className={this.state.prevPageToggleable ? "left-dir click" : "left-dir"}>&lt;</span>
                                    <span onClick={this.nextPage.bind(this)}
                                          className={this.state.nextPageToggleable ? "right-dir click" : "right-dir"}>&gt;</span>
                                </div>
                                <div className="tag_sel_listings">
                                    <select value={this.state.pageSize} onChange={this.onClickHandlerFilter.bind(this)}
                                            name="pageSize">
                                        <option value="10">10</option>
                                        <option value="25">25</option>
                                        <option value="50">50</option>
                                        <option value="100">100</option>
                                    </select>
                                    <span>Per page</span>
                                </div>
                            </div>
                        </div>
                        <div className="tag_right_tag_options" style={{display: 'none'}}>
                            <button>Need Help<FontAwesomeIcon icon={faQuestionCircle} /></button>

                        </div>
                    </div>
                    <div className="all_results_viewp">
                        <div className='datatable_message'>No scans to show for this tag.</div>
                    </div>
                </div>
            )
        }
    }
}

AllTagsResults
    .propTypes = {
    show: PropTypes.bool,
    children: PropTypes.node
};

export default AllTagsResults;