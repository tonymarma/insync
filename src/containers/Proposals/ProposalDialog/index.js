import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { IconButton } from '@material-ui/core';
import './index.css';
import {
    fetchProposalDetails,
    fetchProposalTally,
    fetchVoteDetails,
    getProposals,
    hideProposalDialog,
    showProposalDialog,
} from '../../../actions/proposals';
import Icon from '../../../components/Icon';
import Voting from './Voting';
import moment from 'moment';
import ClassNames from 'classnames';
import { tally } from '../../../utils/numberFormats';
import NavBar from '../../NavBar';
import variables from '../../../utils/variables';
import UnSuccessDialog from '../../Stake/DelegateDialog/UnSuccessDialog';
import PendingDialog from '../../Stake/DelegateDialog/PendingDialog';
import SuccessDialog from '../../Stake/DelegateDialog/SuccessDialog';
import withRouter from '../../../components/WithRouter';

class ProposalDialog extends Component {
    constructor (props) {
        super(props);

        this.state = {
            show: false,
        };

        this.handleChange = this.handleChange.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.VoteCalculation = this.VoteCalculation.bind(this);
    }

    componentDidMount () {
        let votedOption = this.props.voteDetails && this.props.voteDetails.length && this.props.proposal && this.props.proposal.id &&
            this.props.voteDetails.filter((vote) => vote.proposal_id === this.props.proposal.id)[0];
        if (votedOption && votedOption.options && votedOption.options.length && votedOption.options[0]) {
            votedOption = votedOption.options[0];
        }
        if (!votedOption && this.props.proposal && this.props.proposal.id && this.props.address) {
            this.props.fetchVoteDetails(this.props.proposal.id, this.props.address);
        }

        if (this.props.router && this.props.router.params && this.props.router.params.proposalID) {
            if (this.props.proposal && !this.props.proposal.id) {
                this.props.getProposals((result) => {
                    if (result && result.length) {
                        const proposal = result.find((val) => val.id === this.props.router.params.proposalID);
                        this.props.showProposalDialog(proposal);
                        if (proposal && (proposal.status === 2 || proposal.status === 'PROPOSAL_STATUS_VOTING_PERIOD')) {
                            this.props.fetchProposalTally(proposal.id);
                        }
                    }
                });
            }

            if (this.props.proposalDetails && !this.props.proposalDetails[this.props.router.params.proposalID]) {
                this.props.fetchProposalDetails(this.props.router.params.proposalID);
            }
        }
    }

    handleChange () {
        this.setState({
            show: !this.state.show,
        });
    }

    VoteCalculation (val) {
        const { proposal } = this.props;

        if (proposal && (proposal.status === 2 || proposal.status === 'PROPOSAL_STATUS_VOTING_PERIOD')) {
            const value = this.props.tallyDetails && this.props.tallyDetails[proposal.id];
            const sum = value && value.yes && value.no && value.no_with_veto && value.abstain &&
                (parseInt(value.yes) + parseInt(value.no) + parseInt(value.no_with_veto) + parseInt(value.abstain));
            let val1 = null;
            if (val === 'yes_count') {
                val1 = 'yes';
            } else if (val === 'no_count') {
                val1 = 'no';
            } else if (val === 'no_with_veto_count') {
                val1 = 'no_with_veto';
            } else if (val === 'abstain_count') {
                val1 = 'abstain';
            }

            return (this.props.tallyDetails && this.props.tallyDetails[proposal.id] && this.props.tallyDetails[proposal.id][val1]
                ? tally(this.props.tallyDetails[proposal.id][val1], sum) : '0%');
        } else {
            const sum = proposal && proposal.final_tally_result && proposal.final_tally_result.yes_count &&
                proposal.final_tally_result.no_count && proposal.final_tally_result.no_with_veto_count &&
                proposal.final_tally_result.abstain_count &&
                (parseInt(proposal.final_tally_result.yes_count) + parseInt(proposal.final_tally_result.no_count) +
                    parseInt(proposal.final_tally_result.no_with_veto_count) + parseInt(proposal.final_tally_result.abstain_count));

            return (proposal && proposal.final_tally_result &&
            proposal.final_tally_result[val]
                ? tally(proposal.final_tally_result[val], sum) : '0%');
        }
    }

    handleClose () {
        this.props.router.navigate('/proposals');
        this.props.handleClose();
    }

    render () {
        let votedOption = this.props.voteDetails && this.props.voteDetails.length &&
            this.props.proposal && this.props.proposal.id &&
            this.props.voteDetails.filter((vote) => vote && vote.proposal_id === this.props.proposal.id)[0];
        if (votedOption && votedOption.options && votedOption.options.length && votedOption.options[0]) {
            votedOption = votedOption.options[0];
        }
        let proposer = this.props.proposal && this.props.proposal.proposer;

        this.props.proposalDetails && Object.keys(this.props.proposalDetails).length &&
        Object.keys(this.props.proposalDetails).filter((key) => {
            if (this.props.proposal && key === this.props.proposal.id) {
                if (this.props.proposalDetails[key] &&
                    this.props.proposalDetails[key][0] &&
                    this.props.proposalDetails[key][0].body &&
                    this.props.proposalDetails[key][0].body.messages &&
                    this.props.proposalDetails[key][0].body.messages.length &&
                    this.props.proposalDetails[key][0].body.messages[0] &&
                    this.props.proposalDetails[key][0].body.messages[0].proposer) {
                    proposer = this.props.proposalDetails[key][0].body.messages[0].proposer;
                }
            }

            return null;
        });

        const content = this.props.proposal && this.props.proposal.messages && this.props.proposal.messages[0] && this.props.proposal.messages[0].content;

        return (
            <div className="proposals">
                <NavBar proposalTab={true}/>
                {this.props.proposalsInProgress
                    ? <div className="proposals_content padding">
                        <div className="cards_content loading_card">Loading...</div>
                    </div>
                    : this.props.proposal && this.props.proposal.id
                        ? <div className="proposal_dialog padding">
                            <div className="content">
                                <IconButton className="close_button" onClick={this.handleClose}>
                                    <Icon className="close" icon="close"/>
                                </IconButton>
                                <div className="proposal_dialog_section1">
                                    <div
                                        className="proposal_dialog_section1_header">{this.props.proposal && this.props.proposal.title}</div>
                                    <div
                                        className={ClassNames('proposal_dialog_section1_status', this.props.proposal &&
                                        (this.props.proposal.status === 2 || this.props.proposal.status === 'PROPOSAL_STATUS_VOTING_PERIOD')
                                            ? 'voting_period'
                                            : this.props.proposal && (this.props.proposal.status === 4 ||
                                                this.props.proposal.status === 'PROPOSAL_STATUS_REJECTED')
                                                ? 'rejected'
                                                : null)}> Proposal
                                        Status: &nbsp;{this.props.proposal && this.props.proposal.status
                                            ? this.props.proposal.status === 0 ||
                                            this.props.proposal.status === 'PROPOSAL_STATUS_UNSPECIFIED' ? 'Nil'
                                                : this.props.proposal.status === 1 ||
                                                this.props.proposal.status === 'PROPOSAL_STATUS_DEPOSIT_PERIOD' ? 'DepositPeriod'
                                                    : this.props.proposal.status === 2 ||
                                                    this.props.proposal.status === 'PROPOSAL_STATUS_VOTING_PERIOD' ? 'VotingPeriod'
                                                        : this.props.proposal.status === 3 ||
                                                        this.props.proposal.status === 'PROPOSAL_STATUS_PASSED' ? 'Passed'
                                                            : this.props.proposal.status === 4 ||
                                                            this.props.proposal.status === 'PROPOSAL_STATUS_REJECTED' ? 'Rejected'
                                                                : this.props.proposal.status === 5 ||
                                                                this.props.proposal.status === 'PROPOSAL_STATUS_FAILED' ? 'Failed' : ''
                                            : ''}</div>
                                </div>
                                <div className="proposal_dialog_section2">
                                    <pre
                                        className={ClassNames('proposal_dialog_section2_content', this.state.show ? 'show_more' : '')}>
                                        {this.props.proposal && this.props.proposal.summary}
                                    </pre>
                                    <div
                                        className="proposal_dialog_section2_more"
                                        onClick={this.handleChange}>
                                        {this.state.show
                                            ? 'Read Less...'
                                            : 'Read More...'}
                                    </div>
                                </div>
                                <div className="proposal_dialog_section3">
                                    <div className="proposal_dialog_section3_left">
                                        <div className="pds3l_c">
                                            <p className="pds3l_c1">Proposer</p>
                                            {proposer && <div className="pds3l_c2 hash_text" title={proposer}>
                                                <p className="name">{proposer}</p>
                                                {proposer &&
                                                    proposer.slice(proposer.length - 6, proposer.length)}
                                            </div>}
                                        </div>
                                        <div className="pds3l_c">
                                            <p className="pds3l_c1">Submitted on</p>
                                            <p className="pds3l_c2">{this.props.proposal && this.props.proposal.submit_time
                                                ? moment(this.props.proposal.submit_time).format('DD-MMM-YYYY HH:mm:ss') : ''}</p>
                                        </div>
                                        <div className="pds3l_c">
                                            <p className="pds3l_c1">Voting Period</p>
                                            <div className="pds3l_c2 vp_cards">
                                                <p>{this.props.proposal && this.props.proposal.voting_start_time
                                                    ? moment(this.props.proposal.voting_start_time).format('DD-MMM-YYYY HH:mm:ss') : ''}</p>
                                                <p>{this.props.proposal && this.props.proposal.voting_end_time
                                                    ? moment(this.props.proposal.voting_end_time).format('DD-MMM-YYYY HH:mm:ss') : ''}</p>
                                            </div>
                                        </div>
                                        <div className="pds3l_c">
                                            <p className="pds3l_c1">Voting Status</p>
                                            <div className={ClassNames('pds3l_c2 vote_details',
                                                this.props.proposal && (this.props.proposal.status === 2 ||
                                                    this.props.proposal.status === 'PROPOSAL_STATUS_VOTING_PERIOD') ? 'vote_in_progress' : '')}>
                                                <div className="yes">
                                                    <span/>
                                                    <p>YES ({this.VoteCalculation('yes_count')})</p>
                                                </div>
                                                <div className="no">
                                                    <span/>
                                                    <p>NO ({this.VoteCalculation('no_count')})</p>
                                                </div>
                                                <div className="option3">
                                                    <span/>
                                                    <p>NoWithVeto ({this.VoteCalculation('no_with_veto_count')})</p>
                                                </div>
                                                <div className="option4">
                                                    <span/>
                                                    <p>Abstain ({this.VoteCalculation('abstain_count')})</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="pds3l_c">
                                            <p className="pds3l_c1">Type</p>
                                            <p className="pds3l_c2 type">{this.props.proposal && content && content.type
                                                ? content.type
                                                : this.props.proposal && content && content['@type']
                                                    ? content['@type'] : null}</p>
                                        </div>
                                    </div>
                                    {this.props.proposal && (this.props.proposal.status === 2 ||
                                        this.props.proposal.status === 'PROPOSAL_STATUS_VOTING_PERIOD') && !this.props.voteDetailsInProgress
                                        ? <Voting proposalId={this.props.proposal && this.props.proposal.id}/>
                                        : null}
                                </div>
                                {votedOption
                                    ? <div className="already_voted">
                                        <Icon className="right-arrow" icon="right-arrow"/>
                                        <p>{`you voted “${
                                            votedOption && (votedOption.option === 1 || votedOption.option === 'VOTE_OPTION_YES') ? 'Yes'
                                                : votedOption && (votedOption.option === 2 || votedOption.option === 'VOTE_OPTION_ABSTAIN') ? 'Abstain'
                                                    : votedOption && (votedOption.option === 3 || votedOption.option === 'VOTE_OPTION_NO') ? 'No'
                                                        : votedOption && (votedOption.option === 4 || votedOption.option === 'VOTE_OPTION_NO_WITH_VETO') ? 'NoWithVeto'
                                                            : votedOption && votedOption.option
                                        }” for this proposal`}</p>
                                    </div>
                                    : null}
                            </div>
                        </div>
                        : <div className="proposal_dialog padding">
                            <div className="content loading_card">
                                {variables[this.props.lang]['no_data_found']}
                                <IconButton className="close_button" onClick={this.handleClose}>
                                    <Icon className="close" icon="close"/>
                                </IconButton>
                            </div>
                        </div>}
                <UnSuccessDialog/>
                <PendingDialog/>
                <SuccessDialog/>
            </div>
        );
    }
}

ProposalDialog.propTypes = {
    fetchProposalDetails: PropTypes.func.isRequired,
    fetchProposalTally: PropTypes.func.isRequired,
    fetchVoteDetails: PropTypes.func.isRequired,
    getProposals: PropTypes.func.isRequired,
    handleClose: PropTypes.func.isRequired,
    lang: PropTypes.string.isRequired,
    proposalDetails: PropTypes.object.isRequired,
    showProposalDialog: PropTypes.func.isRequired,
    tallyDetails: PropTypes.object.isRequired,
    voteDetails: PropTypes.array.isRequired,
    voteDetailsInProgress: PropTypes.bool.isRequired,
    address: PropTypes.string,
    proposal: PropTypes.object,
    proposalsInProgress: PropTypes.bool,
    router: PropTypes.shape({
        navigate: PropTypes.func.isRequired,
        params: PropTypes.shape({
            proposalID: PropTypes.string,
        }).isRequired,
    }),
    votes: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            voter: PropTypes.string.isRequired,
            option: PropTypes.number,
        }),
    ),
};

const stateToProps = (state) => {
    return {
        lang: state.language,
        proposalsInProgress: state.proposals._.inProgress,
        proposalDetails: state.proposals.proposalDetails.value,
        proposal: state.proposals.dialog.value,
        votes: state.proposals.votes.list,
        address: state.accounts.address.value,
        voteDetails: state.proposals.voteDetails.value,
        voteDetailsInProgress: state.proposals.voteDetails.inProgress,
        tallyDetails: state.proposals.tallyDetails.value,
    };
};

const actionToProps = {
    handleClose: hideProposalDialog,
    fetchProposalDetails,
    fetchProposalTally,
    fetchVoteDetails,
    getProposals,
    showProposalDialog,
};

export default withRouter(connect(stateToProps, actionToProps)(ProposalDialog));
