use candid::{candid_method, CandidType, Nat};
use ic_cdk_macros::*;
use serde::{Deserialize, Serialize};
use crate::consent::ConsentMessageResponse::{MalformedCall, Valid};

use crate::transfer;

const LANG_EN: &str = "en";

const METHOD_TRANSFER: &str = "transfer";

const ERROR_LANGUAGE_NOT_SUPPORTED: u64 = 1001;
const ERROR_METHOD_NOT_SUPPORTED: u64 = 2001;
const ERROR_ARG_DECODE_FAILED: u64 = 3001;

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, Hash)]
pub struct ConsentPreferences {
    language: String,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, Hash)]
pub struct ConsentMessageRequest {
    method: String,
    arg: Vec<u8>,
    consent_preferences: ConsentPreferences,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, Hash)]
pub struct ConsentInfo {
    consent_message: String,
    language: String,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, Hash)]
pub struct ErrorInfo {
    error_code: Nat,
    description: String,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, Hash)]
pub enum ConsentMessageResponse {
    Valid(ConsentInfo),
    Forbidden(ErrorInfo),
    MalformedCall(ErrorInfo),
}

#[query]
#[candid_method(query)]
pub async fn consent_message(request: ConsentMessageRequest) -> ConsentMessageResponse {
    let lang = request.consent_preferences.language.as_str();
    match lang {
        LANG_EN => consent_message_en(request.method.as_str(), request.arg.as_slice()),
        _ => MalformedCall(
            ErrorInfo {
                error_code: Nat::from(ERROR_LANGUAGE_NOT_SUPPORTED),
                description: format!("Language not supported: {:?}", lang),
            }
        )
    }
}

fn consent_message_en(method: &str, arg: &[u8]) -> ConsentMessageResponse {
    match method {
        METHOD_TRANSFER => consent_message_en_transfer(arg),
        _ => MalformedCall(
            ErrorInfo {
                error_code: Nat::from(ERROR_METHOD_NOT_SUPPORTED),
                description: format!("Method not supported: {:?}", method),
            }
        )
    }
}

fn consent_message_en_transfer(arg: &[u8]) -> ConsentMessageResponse {
    let result = transfer::decode_arg(arg);
    if let Err(e) = result {
        return MalformedCall(
            ErrorInfo {
                error_code: Nat::from(ERROR_ARG_DECODE_FAILED),
                description: e,
            }
        )
    }

    let decoded_arg = result.unwrap();
    let consent_info = ConsentInfo {
        consent_message: format!("Transfer {} DEV to principal {} subaccount {:?}", decoded_arg.amount, decoded_arg.to.owner, decoded_arg.to.subaccount),
        language: String::from(LANG_EN),
    };

    Valid(consent_info)
}