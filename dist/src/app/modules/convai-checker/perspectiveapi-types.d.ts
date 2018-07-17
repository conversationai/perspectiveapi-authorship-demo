export interface AnalyzeCommentRequest {
    comment: TextEntry;
    context?: Context;
    languages?: string[];
    requested_attributes: RequestedAttributes;
    do_not_store?: boolean;
    client_token?: string;
    session_id?: string;
    community_id?: string;
    span_annotations?: boolean;
}
export interface RequestedAttributes {
    [key: string]: AttributeParameters;
}
export interface AttributeParameters {
    score_type?: string;
    score_threshold?: FloatValue;
}
export interface FloatValue {
    value: number;
}
export interface AnalyzeCommentResponse {
    attributeScores?: AttributeScores;
    languages?: string[];
    clientToken?: string;
}
export interface SuggestCommentScoreRequest {
    comment: TextEntry;
    context?: Context;
    languages?: string[];
    attribute_scores?: AttributeScores;
    community_id?: string;
    user_id?: string;
    client_token?: string;
}
export interface AnalyzeCommentData {
    comment: string;
    sessionId: string;
    languages?: string[];
    doNotStore?: boolean;
    clientToken?: string;
    communityId?: string;
    spanAnnotations?: boolean;
    parentComment?: string;
    articleText?: string;
}
export interface SuggestCommentScoreData {
    comment: string;
    sessionId: string;
    commentMarkedAsToxic: boolean;
}
export interface AttributeScores {
    [key: string]: SpanScores;
}
export interface SuggestCommentScoreResponse {
    client_token?: string;
}
export interface TextEntry {
    text: string;
    type?: string;
}
export interface Context {
    entries?: TextEntry[];
    article_and_parent_comment?: ArticleAndParentComment;
}
export interface ArticleAndParentComment {
    article: TextEntry;
    parent_comment?: TextEntry;
}
export interface SpanScores {
    spanScores?: SpanScore[];
    summaryScore?: Score;
}
export interface SpanScore {
    begin?: number;
    end?: number;
    score: Score;
}
export interface Score {
    value: number;
    type?: string;
}
export interface PerspectiveGapiClient {
    commentanalyzer: GapiCommentAnalyzer;
}
export interface GapiCommentAnalyzer {
    comments: GapiAnalyzer;
}
export interface GapiAnalyzeCommentResponse {
    result: AnalyzeCommentResponse;
}
export interface GapiSuggestCommentScoreResponse {
    result: SuggestCommentScoreResponse;
}
export interface GapiAnalyzeCommentRequest extends AnalyzeCommentRequest {
}
export interface GapiSuggestCommentScoreRequest extends SuggestCommentScoreRequest {
}
export interface GapiAnalyzer {
    analyze(obj: GapiAnalyzeCommentRequest): Promise<GapiAnalyzeCommentResponse>;
    suggestscore(obj: GapiSuggestCommentScoreRequest): Promise<GapiSuggestCommentScoreResponse>;
}
export interface NodeAnalyzeApiClient {
    comments: NodeAnalyzer;
}
export interface NodeAnalyzeCommentRequest {
    key: string;
    resource: AnalyzeCommentRequest;
}
export interface NodeSuggestCommentScoreRequest {
    key: string;
    resource: SuggestCommentScoreRequest;
}
export interface NodeAnalyzeCommentResponse extends AnalyzeCommentResponse {
}
export interface NodeSuggestCommentScoreResponse extends SuggestCommentScoreResponse {
}
export interface NodeAnalyzer {
    analyze(obj: NodeAnalyzeCommentRequest, handleFn: (error: Error, response: AnalyzeCommentResponse) => void): Promise<NodeAnalyzeCommentResponse>;
    suggestscore(obj: NodeSuggestCommentScoreRequest, handleFn: (error: Error, response: SuggestCommentScoreResponse) => void): Promise<NodeSuggestCommentScoreResponse>;
}
export interface ResponseError {
    code: number;
    errors: string[];
}
